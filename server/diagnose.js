const mysql = require('mysql2/promise');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
require('dotenv').config();

async function diagnose() {
    console.log("--- START DIAGNOSTIC ---");

    // 1. Check DB
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await pool.execute('SELECT 1');
        console.log("✅ DB Connection: OK");

        // Check columns
        const [cols] = await pool.execute("SHOW COLUMNS FROM users");
        const fields = cols.map(c => c.Field);
        const hasTone = fields.includes('ai_tone');
        if (hasTone) console.log("✅ DB Columns (ai_tone): OK");
        else console.error("❌ DB Columns: Missing 'ai_tone'");

        await pool.end();
    } catch (e) {
        console.error("❌ DB Error:", e.message);
    }

    // 2. Check Groq
    try {
        if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
        await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Ping' }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
        });
        console.log("✅ Groq API: OK");
    } catch (e) {
        console.error("❌ Groq Error:", e.response?.data || e.message);
    }

    // 3. Check YouTube (Transcript)
    try {
        // Test with a known video (e.g., a popular one likely to have captions)
        // YouTube Rewind 2018: YbJOTdZBX1g
        await YoutubeTranscript.fetchTranscript('YbJOTdZBX1g');
        console.log("✅ YouTube Transcript: OK");
    } catch (e) {
        console.error("❌ YouTube Transcript Error:", e.message);
    }

    console.log("--- END DIAGNOSTIC ---");
}

diagnose();
