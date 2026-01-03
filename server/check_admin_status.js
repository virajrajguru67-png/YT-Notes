const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute('SELECT id, username, email, role FROM users WHERE email = ?', ['admin@demo.com']);
        console.log('Admin User Status:', rows[0]);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

checkAdmin();
