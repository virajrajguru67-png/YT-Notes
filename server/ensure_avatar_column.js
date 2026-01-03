const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Checking for avatar_url column...');
        const [rows] = await pool.execute('DESCRIBE users');
        const columnExists = rows.some(row => row.Field === 'avatar_url');

        if (!columnExists) {
            console.log('Adding avatar_url column...');
            await pool.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT');
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
        console.log('Connection closed.');
    }
}

run();
