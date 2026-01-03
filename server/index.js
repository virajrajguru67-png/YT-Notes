const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.YTDL_NO_CACHE = 'true';
const app = express();
const multer = require('multer');
const nodemailer = require('nodemailer');
app.enable('trust proxy');
app.use(cors());
app.use(express.json());

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Test/Status Route
app.get('/api/test', (req, res) => res.json({ status: 'ok', message: 'Server is running' }));
app.get('/api/auth/google', (req, res) => res.status(405).json({ error: 'Method Not Allowed. Use POST.' }));

app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads/avatars');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const { YoutubeTranscript } = require('youtube-transcript');
const ytdl = require('@distube/ytdl-core');
const os = require('os');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// YouTube API Key Rotation Helper
const YOUTUBE_KEYS = (process.env.YOUTUBE_API_KEYS || "").split(',').filter(k => k.trim());
let currentKeyIndex = 0;

async function fetchFromYouTube(endpoint, params) {
    if (YOUTUBE_KEYS.length === 0) {
        throw new Error("No YouTube API keys found in .env");
    }

    // Try each key starting from the current one
    let lastError = null;
    for (let i = 0; i < YOUTUBE_KEYS.length; i++) {
        const attemptIndex = (currentKeyIndex + i) % YOUTUBE_KEYS.length;
        const key = YOUTUBE_KEYS[attemptIndex];

        try {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/${endpoint}`, {
                params: { ...params, key }
            });

            // If we successfully used a different key, update the global index
            if (currentKeyIndex !== attemptIndex) {
                console.log(`Successfully switched to YouTube Key ${attemptIndex + 1}`);
            }
            currentKeyIndex = attemptIndex;
            return response.data;
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            const errorMsg = error.response?.data?.error?.message || error.message;

            // If it's a quota error (403) or a "key not valid" error (400), try the next key
            // Note: 403 can also be "forbidden" for other reasons, but usually quota on search
            if (status === 403 || status === 400 || errorMsg.toLowerCase().includes('quota') || i < YOUTUBE_KEYS.length - 1) {
                console.warn(`YouTube Key ${attemptIndex + 1} failed (${status}): ${errorMsg.substring(0, 100)}. Trying next key...`);
                continue;
            } else {
                throw error;
            }
        }
    }
    throw lastError;
}

// Middleware: Authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(101).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
    });
};

// Helper: Get Cookies from file (Manual Method)
async function getLocalCookies() {
    try {
        const cookiePath = path.join(__dirname, 'cookies.json');
        if (fs.existsSync(cookiePath)) {
            console.log('Found manual cookies.json file.');
            const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
            // Innertube cookie format is just a string "key=value; key=value;"
            if (Array.isArray(cookies)) {
                return cookies.map(c => `${c.name}=${c.value}`).join('; ');
            }
            return ""; // Assume it's not the array format we expect or handle other formats if needed
        }
    } catch (e) {
        console.warn('Error reading cookies.json:', e);
    }
    return "";
}

// Helper: Download Audio using yt-dlp (The "Nuclear Option" for reliability)
async function downloadAudio(videoId) {
    const ytDlp = require('yt-dlp-exec');
    return new Promise(async (resolve, reject) => {
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`Downloading audio via yt-dlp: ${videoUrl}`);

            // Output template: tempDir/videoId.extension
            const outputTemplate = path.join(os.tmpdir(), `${videoId}.%(ext)s`);

            // Delete ANY existing files with this videoId prefix to avoid confusion
            const tempDir = os.tmpdir();
            fs
                .readdirSync(tempDir)
                .forEach(file => {
                    if (file.startsWith(videoId)) {
                        try { fs.unlinkSync(path.join(tempDir, file)); } catch (e) { }
                    }
                });

            // Download best audio explicitly (m4a or webm are supported by Groq)
            // avoiding 'extractAudio' which requires ffmpeg
            await ytDlp(videoUrl, {
                format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
                output: outputTemplate,
                noCheckCertificates: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ]
            });

            // Find the file that was just created
            const downloadedFile = fs.readdirSync(tempDir).find(file => file.startsWith(videoId));
            if (!downloadedFile) throw new Error('Download appeared to finish but no file was found.');

            const finalPath = path.join(tempDir, downloadedFile);
            console.log(`Audio downloaded to: ${finalPath}`);
            resolve(finalPath);

        } catch (error) {
            console.error('yt-dlp Download Error:', error);
            reject(error);
        }
    });
}

// Helper: Transcribe Audio with Groq Whisper
async function transcribeWithWhisper(filePath) {
    console.log('Transcribing audio with Groq Whisper...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'text');

    try {
        const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                ...formData.getHeaders()
            },
            maxBodyLength: Infinity // Allow large files
        });
        return response.data;
    } catch (error) {
        console.error('Whisper Transcription Error:', error.response?.data || error.message);
        throw new Error('Failed to transcribe audio.');
    } finally {
        // Clean up temp file
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });
    }
}

// Helper: Extract Transcript Logic
async function fetchTranscript(videoId) {
    try {
        console.log(`Fetching transcript (youtube-transcript) for: ${videoId}`);

        // Fetch transcript - automatically handles auto-generated captions
        // Fetch transcript - try to get the default language or fallback to English
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

        const transcriptText = transcriptItems
            .map(item => item.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!transcriptText) throw new Error("Transcript empty");

        return transcriptText;

    } catch (e) {
        console.warn(`Standard transcript fetch failed: ${e.message}. Attempting Audio Fallback...`);

        try {
            // Fallback: Download Audio & Transcribe
            const audioPath = await downloadAudio(videoId);
            const transcript = await transcribeWithWhisper(audioPath);
            return transcript;
        } catch (audioError) {
            console.error('Audio Fallback failed:', audioError);
            throw new Error(`Could not fetch transcript (even via audio): ${e.message}`);
        }
    }
}

// Routes
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
            return res.status(403).json({
                error: `Account suspended until ${new Date(user.suspended_until).toLocaleDateString()}`
            });
        }


        const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                avatar_url: user.avatar_url,
                ai_tone: user.ai_tone,
                ai_detail_level: user.ai_detail_level,
                ai_language: user.ai_language
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const userId = rows[0].id;
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.execute(
            'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
            [token, expires, userId]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const resetLink = `${frontendUrl}/auth?token=${token}`;

        // Send the real email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Password Reset - NoteTube AI',
            text: `Hello, Reset your password here: ${resetLink}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #10b981;">Reset Your Password</h2>
                    <p>Click the link below to set a new password for your NoteTube AI account:</p>
                    <p><a href="${resetLink}" style="color: #10b981; font-weight: bold;">Reset Password</a></p>
                    <p>This link will expire in 1 hour.</p>
                    <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Success! Response: ${JSON.stringify(info)}`);

        res.json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [rows] = await pool.execute(
            'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const userId = rows[0].id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [noteRows] = await pool.execute('SELECT COUNT(*) as count FROM notes_history');

        res.json({
            users: userRows[0].count,
            notes: noteRows[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, email, role, suspended_until, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/:id/suspend', authenticateAdmin, async (req, res) => {
    const { duration } = req.body; // 'day', 'week', 'month', 'year', 'permanent'
    let suspendUntil = new Date();

    switch (duration) {
        case 'day': suspendUntil.setDate(suspendUntil.getDate() + 1); break;
        case 'week': suspendUntil.setDate(suspendUntil.getDate() + 7); break;
        case 'month': suspendUntil.setMonth(suspendUntil.getMonth() + 1); break;
        case 'year': suspendUntil.setFullYear(suspendUntil.getFullYear() + 1); break;
        case 'permanent': suspendUntil.setFullYear(suspendUntil.getFullYear() + 100); break;
        default: return res.status(400).json({ error: 'Invalid duration' });
    }

    try {
        await pool.execute('UPDATE users SET suspended_until = ? WHERE id = ?', [suspendUntil, req.params.id]);
        res.json({ message: `User suspended until ${suspendUntil.toLocaleDateString()}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/:id/unsuspend', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('UPDATE users SET suspended_until = NULL WHERE id = ?', [req.params.id]);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/notes', authenticateAdmin, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT notes_history.id, notes_history.title, notes_history.video_id, notes_history.created_at, users.username 
            FROM notes_history 
            JOIN users ON notes_history.user_id = users.id 
            ORDER BY notes_history.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/notes/:id', authenticateAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM notes_history WHERE id = ?', [req.params.id]);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    const CLIENT_ID = "509177086998-6k4n22s2igdufn27blepvki8j62srnp8.apps.googleusercontent.com";
    const client = new OAuth2Client(CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub, picture } = payload;

        let [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        let user = rows[0];

        if (user && user.suspended_until && new Date(user.suspended_until) > new Date()) {
            return res.status(403).json({
                error: `Account suspended until ${new Date(user.suspended_until).toLocaleDateString()}`
            });
        }

        if (!user) {
            const password = await bcrypt.hash(sub + "GOOGLE_SECURE_AUTH", 10);
            let username = name || email.split('@')[0];

            // Simple duplicate username check
            const [uRows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
            if (uRows.length > 0) {
                username += Math.floor(Math.random() * 10000);
            }

            await pool.execute(
                'INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)',
                [username, email, password, picture]
            );
            [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
            user = rows[0];
        }

        const jwtToken = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user',
                avatar_url: user.avatar_url,
                ai_tone: user.ai_tone,
                ai_detail_level: user.ai_detail_level,
                ai_language: user.ai_language
            }
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: error.message || "Google Authentication Failed" });
    }
});

app.post('/api/update-user', authenticateToken, async (req, res) => {
    const { username, email, password, ai_tone, ai_detail_level, ai_language } = req.body;
    const userId = req.user.id;
    try {
        let query = 'UPDATE users SET username = ?, email = ?, avatar_url = ?, ai_tone = ?, ai_detail_level = ?, ai_language = ?';
        let params = [
            username,
            email,
            req.body.avatar_url || null,
            ai_tone || 'educational',
            ai_detail_level || 'detailed',
            ai_language || 'en'
        ];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await pool.execute(query, params);
        res.json({
            message: 'User updated successfully',
            user: {
                id: userId,
                username,
                email,
                avatar_url: req.body.avatar_url || null,
                ai_tone: ai_tone || 'educational',
                ai_detail_level: ai_detail_level || 'detailed',
                ai_language: ai_language || 'en'
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = `http://localhost:3001/uploads/avatars/${req.file.filename}`;
        const userId = req.user.id;

        await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);

        res.json({ avatar_url: avatarUrl, message: 'Avatar uploaded successfully' });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

app.delete('/api/delete-avatar', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.execute('UPDATE users SET avatar_url = NULL WHERE id = ?', [userId]);
        res.json({ message: 'Avatar deleted successfully' });
    } catch (error) {
        console.error('Avatar delete error:', error);
        res.status(500).json({ error: 'Failed to delete avatar' });
    }
});

// Update standard routes to use auth where needed
app.post('/api/process-video', authenticateToken, async (req, res) => {
    const { videoId, manualTranscript } = req.body;
    const userId = req.user.id;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendStatus = (message) => {
        res.write(`data: ${JSON.stringify({ type: 'status', message })}\n\n`);
    };

    try {
        // 1. Fetch Video Info
        sendStatus("Searching for video metadata...");
        let youtubeData;
        try {
            youtubeData = await fetchFromYouTube('videos', {
                part: 'snippet,contentDetails',
                id: videoId
            });
        } catch (metadataErr) {
            console.error("Metadata fetch failed after rotation:", metadataErr.message);
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch video metadata from YouTube' })}\n\n`);
            return res.end();
        }

        if (!youtubeData.items?.length) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: 'Video not found' })}\n\n`);
            return res.end();
        }

        const video = youtubeData.items[0];
        const videoInfo = {
            id: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.high?.url,
            hasCaptions: video.contentDetails.caption === 'true'
        };

        // 2. Get Transcript
        let transcript = manualTranscript;
        if (!transcript) {
            sendStatus(videoInfo.hasCaptions ? "Retrieving transcript..." : "No captions found. Preparing audio fallback...");

            try {
                // Try standard transcript first
                if (videoInfo.hasCaptions) {
                    try {
                        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
                        transcript = transcriptItems.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
                        if (!transcript) throw new Error("Empty transcript");
                    } catch (err) {
                        console.warn("Standard transcript fetch failed, attempting fallback:", err.message);
                        throw err; // Re-throw to trigger catch(e) block below which handles Whisper fallback
                    }
                } else {
                    throw new Error("No captions");
                }
            } catch (e) {
                sendStatus("Extracting audio from video...");
                const audioPath = await downloadAudio(videoId);
                sendStatus("Transcribing audio with Genius AI...");
                transcript = await transcribeWithWhisper(audioPath);
            }
        }

        if (!transcript) throw new Error("Could not obtain video transcript.");

        // 3. Generate Notes via Groq
        sendStatus("Structuring detailed educational notes...");

        // Fetch user preferences for AI
        let prefs = { ai_tone: 'educational', ai_detail_level: 'detailed', ai_language: 'en' };
        try {
            const [userRows] = await pool.execute('SELECT ai_tone, ai_detail_level, ai_language FROM users WHERE id = ?', [userId]);
            if (userRows[0]) prefs = { ...prefs, ...userRows[0] };
        } catch (dbErr) {
            console.warn("Could not fetch AI preferences, using defaults (Check DB migration):", dbErr.message);
        }

        const systemPrompt = `You are an expert educational assistant with a ${prefs.ai_tone} personality. 
        Your goal is to create ${prefs.ai_detail_level} study notes from the provided video transcript. 
        Ensure the notes are written in ${prefs.ai_language === 'hi' ? 'Hindi (Devanagari)' : 'English'}.
        Do NOT summarize too briefly if the user requested detailed notes; preserve all key explanations, examples, and nuances. 
        Use clear Markdown structure with headings, bullet points, and bold text for emphasis.
        
        SPECIAL INSTRUCTIONS FOR SONGS/LYRICS:
        - If the video is a song, provide the lyrics in their ORIGINAL script and a line-by-line translation.
        - करेक्ट (Correct) any errors in auto-captions before processing.
        - Ensure language matches user preference (${prefs.ai_language}).`;

        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Video: ${videoInfo.title}\n\nTranscript: ${transcript.substring(0, 25000)}` }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        const notes = groqRes.data.choices[0].message.content;

        // 4. Save to MySQL with user_id
        sendStatus("Finalizing and saving to your library...");
        await pool.execute(
            'INSERT INTO notes_history (video_id, title, thumbnail, notes, user_id) VALUES (?, ?, ?, ?, ?)',
            [videoInfo.id, videoInfo.title, videoInfo.thumbnail, notes, userId]
        );

        // Send final result
        res.write(`data: ${JSON.stringify({ type: 'done', video: videoInfo, notes })}\n\n`);
        res.end();

    } catch (error) {
        console.error("Process Video Error:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
    const { messages, context, videoTitle } = req.body;
    try {
        // Fetch user preferences for chat tone
        const [userRows] = await pool.execute('SELECT ai_tone, ai_language FROM users WHERE id = ?', [req.user.id]);
        const prefs = userRows[0] || { ai_tone: 'educational', ai_language: 'en' };

        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI tutor assistant with a ${prefs.ai_tone} personality. 
                    The user is asking questions about a video titled "${videoTitle}". 
                    Respond in ${prefs.ai_language === 'hi' ? 'Hindi (Devanagari)' : 'English'}.
                    You have access to the DETAILED NOTES from this video below. 
                    Use these notes to answer the user's questions accurately and explain concepts in depth.
                    If the answer isn't in the notes, use your general knowledge but mention that it wasn't explicitly in the video notes.
                    
                    NOTES CONTEXT:
                    ${context}`
                },
                ...messages.map(m => ({ role: m.role, content: m.content }))
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        res.json({ reply: groqRes.data.choices[0].message.content });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Failed to generate chat response" });
    }
});

app.post('/api/recommendations', async (req, res) => {
    const { videoTitle, notes } = req.body;
    try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                {
                    role: 'system',
                    content: 'You are an intelligent content recommender. Your goal is to suggest 10 relevant, high-quality YouTube search queries or video topics based on the provided video notes. \nFirst, determine the PRIMARY CATEGORY of the content (e.g., Education, Music, Sports, Gaming, Entertainment).\n- If Education/Tech: Suggest advanced study topics, specific technical deep-dives, or related concepts.\n- If Music: Suggest similar artists, genre history, live performances, or music theory.\n- If Sports: Suggest match analysis, player highlights, historical moments, or training guides.\n- If Gaming: Suggest lore videos, pro-level analysis, speedruns, or similar games.\n- If Entertainment/Vlog: Suggest similar creators, related trends, or behind-the-scenes content.\n\nOutput Requirement: Return ONLY a valid JSON array of 10 distinct strings. No other text.'
                },
                {
                    role: 'user',
                    content: `Video Title: ${videoTitle}\n\nDetailed Notes Context: ${notes ? notes.substring(0, 15000) : ''}`
                }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        let content = groqRes.data.choices[0].message.content;
        // Clean markdown code blocks if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let recommendations;
        try {
            recommendations = JSON.parse(content);
            if (!Array.isArray(recommendations)) {
                recommendations = Object.values(recommendations).find(Array.isArray) || [videoTitle];
            }
        } catch (e) {
            console.warn("Failed to parse JSON recommendations, using raw split", content);
            recommendations = content.split('\n').filter(l => l.length > 5).map(l => l.replace(/^[-\d.]+\s*/, ''));
        }

        // Ensure we only process at most 10 items
        const finalRecs = recommendations.slice(0, 10);

        // 2. Fetch YouTube Metadata for only the first 5 topics to save quota
        const enrichedRecs = await Promise.all(finalRecs.map(async (topicItem, index) => {
            const topic = typeof topicItem === 'string' ? topicItem :
                (topicItem.topic || topicItem.query || topicItem.title || JSON.stringify(topicItem));

            if (!topic || topic.length < 2) return null;

            // Only search for the first 5 to save quota
            if (index >= 5) {
                return { query: topic };
            }

            try {
                const searchData = await fetchFromYouTube('search', {
                    part: 'snippet',
                    maxResults: 1,
                    q: topic,
                    type: 'video'
                });

                const item = searchData.items?.[0];
                if (item) {
                    return {
                        query: topic,
                        videoId: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                        channel: item.snippet.channelTitle
                    };
                }
                return { query: topic };
            } catch (searchErr) {
                console.error(`YouTube Search rotation failed for topic "${topic}":`, searchErr.message);
                return { query: topic };
            }
        }));

        // Filter out any nulls if specific mapping failed oddly
        res.json({ recommendations: enrichedRecs.filter(r => r) });
    } catch (error) {
        console.error("Recommendations API Error:", error.response?.data || error.message);

        // Fallback: Use simple queries based on title and try to enrich them anyway
        const queries = [`${videoTitle} Official Video`, `${videoTitle} live`, `Best of ${videoTitle.split('|')[0].trim()}`];

        const fallbackEnriched = await Promise.all(queries.map(async (q) => {
            try {
                if (!process.env.YOUTUBE_API_KEY) return { query: q };
                const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                    params: { part: 'snippet', maxResults: 1, q, type: 'video', key: process.env.YOUTUBE_API_KEY }
                });
                const item = searchRes.data.items?.[0];
                if (item) {
                    return {
                        query: q,
                        videoId: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                        channel: item.snippet.channelTitle
                    };
                }
                return { query: q };
            } catch (e) {
                return { query: q };
            }
        }));

        res.json({ recommendations: fallbackEnriched.filter(r => r) });
    }
});

app.post('/api/generate-flashcards', authenticateToken, async (req, res) => {
    const { notes, videoTitle } = req.body;
    try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an educational tools creator. Create a set of 8-10 high-quality flashcards from the provided video notes. Each flashcard must have a "front" (question/concept) and a "back" (answer/explanation). Return ONLY a JSON array of objects with "front" and "back" keys. No other text.'
                },
                {
                    role: 'user',
                    content: `Video Title: ${videoTitle}\n\nNotes:\n${notes.substring(0, 15000)}`
                }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        let content = groqRes.data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const flashcards = JSON.parse(content);
        res.json({ flashcards });
    } catch (error) {
        console.error("Flashcards API Error:", error);
        res.status(500).json({ error: "Failed to generate flashcards" });
    }
});

app.post('/api/generate-quiz', authenticateToken, async (req, res) => {
    const { notes, videoTitle, videoId } = req.body;
    const userId = req.user.id;
    try {
        // Fetch recent mistakes for this user and video to personalize the quiz
        const [mistakes] = await pool.query(
            'SELECT question, correct_answer FROM quiz_mistakes WHERE user_id = ? AND video_id = ? ORDER BY timestamp DESC LIMIT 3',
            [userId, videoId]
        );

        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are an educational tools creator. Create a 5-question multiple choice quiz from the provided video notes. 
                    PERSONALIZATION RULES:
                    ${mistakes.length > 0 ? `- The user previously struggled with these areas: ${mistakes.map(m => m.question).join(', ')}. Include at least one question that reinforces these concepts.` : ''}
                    - Each question must have a "question", 4 "options", and a "correctAnswer" index (0-3). 
                    - Return ONLY a JSON array of objects with these keys. No other text.`
                },
                {
                    role: 'user',
                    content: `Video Title: ${videoTitle}\n\nNotes:\n${notes.substring(0, 15000)}`
                }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        let content = groqRes.data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const quiz = JSON.parse(content);
        res.json({ quiz });
    } catch (error) {
        console.error("Quiz API Error:", error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});



app.post('/api/synthesize-notes', authenticateToken, async (req, res) => {
    const { noteIds } = req.body;
    const userId = req.user.id;
    try {
        if (!noteIds || !Array.isArray(noteIds) || noteIds.length < 2) {
            return res.status(400).json({ error: "Select at least 2 notes to synthesize" });
        }

        // 1. Fetch all selected notes
        const [rows] = await pool.query(
            'SELECT title, notes FROM notes_history WHERE id IN (?) AND user_id = ?',
            [noteIds, userId]
        );

        if (rows.length < 2) {
            return res.status(404).json({ error: "Notes not found or insufficient access" });
        }

        // 2. Prepare Context for AI
        const combinedContext = rows.map((r, i) => `VIDEO ${i + 1}: ${r.title}\nNOTES ${i + 1}:\n${r.notes}`).join('\n\n---\n\n');

        // 3. Generate Master Guide via Groq
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile', // Upgraded to 70b for better synthesis and larger context
            messages: [
                {
                    role: 'system',
                    content: `You are an expert educational synthesizer. Create a comprehensive, seamless "Master Guide" by combining the provided notes.
                    - CRITICAL: Do NOT skip any key details. Cover ALL topics found in the notes.
                    - Resolve overlaps and remove introductory filler only.
                    - Organize into a logical high-level structure with Sections and Sub-sections.
                    - Usage of Markdown: Use clear headers (#, ##, ###), bold key terms, and bullet points for readability.
                    - Output should feel like a complete textbook chapter.`
                },
                { role: 'user', content: `SYNTHESIZE THESE NOTES (truncated at 30k chars if needed):\n\n${combinedContext.substring(0, 30000)}` }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });

        const masterGuide = groqRes.data.choices[0].message.content;
        res.json({ masterGuide });
    } catch (error) {
        console.error("Synthesis Error:", error);
        res.status(500).json({ error: "Failed to synthesize Master Guide" });
    }
});

app.post('/api/report-mistake', authenticateToken, async (req, res) => {
    const { videoId, question, correctAnswer, userAnswer } = req.body;
    const userId = req.user.id;
    try {
        await pool.execute(
            'INSERT INTO quiz_mistakes (user_id, video_id, question, correct_answer, user_answer) VALUES (?, ?, ?, ?, ?)',
            [userId, videoId, question, correctAnswer, userAnswer]
        );
        res.json({ message: 'Mistake recorded successfully' });
    } catch (error) {
        console.error("Report Mistake Error:", error);
        res.status(500).json({ error: "Failed to record mistake" });
    }
});

app.get('/api/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM notes_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.execute('DELETE FROM notes_history WHERE user_id = ?', [userId]);
        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/history/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const noteId = req.params.id;
    try {
        await pool.execute('DELETE FROM notes_history WHERE id = ? AND user_id = ?', [noteId, userId]);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Knowledge Collections (Courses) API ---

app.post('/api/collections', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO collections (user_id, name, description) VALUES (?, ?, ?)',
            [req.user.id, name, description]
        );
        res.json({ id: result.insertId, name, description });
    } catch (error) {
        console.error("Create Course Error:", error);
        res.status(500).json({ error: "Failed to create course" });
    }
});

app.get('/api/collections', authenticateToken, async (req, res) => {
    try {
        const [collections] = await pool.query(
            'SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        // Fetch items for each collection
        for (let collection of collections) {
            const [items] = await pool.query(
                `SELECT ci.*, nh.title, nh.thumbnail, nh.video_id 
                 FROM collection_items ci 
                 JOIN notes_history nh ON ci.note_id = nh.id 
                 WHERE ci.collection_id = ? 
                 ORDER BY ci.added_at DESC`,
                [collection.id]
            );
            collection.items = items;
        }

        res.json(collections);
    } catch (error) {
        console.error("Fetch Courses Error:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});


app.get('/api/collections/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Course not found" });
        const collection = rows[0];

        const [items] = await pool.query(
            `SELECT ci.*, nh.title, nh.thumbnail, nh.video_id, nh.notes 
             FROM collection_items ci 
             JOIN notes_history nh ON ci.note_id = nh.id 
             WHERE ci.collection_id = ? 
             ORDER BY ci.added_at DESC`,
            [collection.id]
        );
        collection.items = items;

        res.json(collection);
    } catch (error) {
        console.error("Fetch Course Details Error:", error);
        res.status(500).json({ error: "Failed to fetch course details" });
    }
});

app.post('/api/collections/:id/add', authenticateToken, async (req, res) => {
    const { noteId } = req.body;
    try {
        // Check ownership
        const [collection] = await pool.query('SELECT * FROM collections WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (collection.length === 0) return res.status(403).json({ error: "Unauthorized" });

        await pool.query(
            'INSERT IGNORE INTO collection_items (collection_id, note_id) VALUES (?, ?)',
            [req.params.id, noteId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Add to Course Error:", error);
        res.status(500).json({ error: "Failed to add note to course" });
    }
});

app.delete('/api/collections/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM collections WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Course not found" });
        res.json({ success: true });
    } catch (error) {
        console.error("Delete Course Error:", error);
        res.status(500).json({ error: "Failed to delete course" });
    }
});

// Export for Vercel
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
