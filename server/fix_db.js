const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function run() {
    let output = '--- STARTING DB FIX ---\n';
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        output += 'Connected to database.\n';

        try {
            await connection.execute('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL');
            output += 'SUCCESS: Added reset_token.\n';
        } catch (e) {
            output += `NOTE: reset_token error: ${e.message}\n`;
        }

        try {
            await connection.execute('ALTER TABLE users ADD COLUMN reset_expires DATETIME DEFAULT NULL');
            output += 'SUCCESS: Added reset_expires.\n';
        } catch (e) {
            output += `NOTE: reset_expires error: ${e.message}\n`;
        }

        output += '--- DB FIX COMPLETED ---\n';
    } catch (err) {
        output += `FATAL ERROR: ${err.message}\n`;
    } finally {
        if (connection) await connection.end();
        fs.writeFileSync('db_fix_result.txt', output);
    }
}

run();
