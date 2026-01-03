const nodemailer = require('nodemailer');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testPort(port, secure) {
    console.log(`\n--- Testing Port ${port} (secure: ${secure}) ---`);
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: 'virajrajguru67@gmail.com',
        subject: `SMTP Test Port ${port}`,
        text: `Testing SMTP delivery via port ${port}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Port ${port} success:`, info.response);
        return true;
    } catch (error) {
        console.error(`Port ${port} failed:`, error.message);
        return false;
    }
}

async function run() {
    console.log('Credentials:', process.env.SMTP_USER, 'Password Length:', process.env.SMTP_PASS?.length);
    await testPort(587, false);
    await testPort(465, true);
}

run();
