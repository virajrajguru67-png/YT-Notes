const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Adding reset_token and reset_expires columns to users table...');

        // Add reset_token
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL');
            console.log('Added reset_token column.');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('reset_token column already exists.');
            } else {
                throw err;
            }
        }

        // Add reset_expires
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN reset_expires DATETIME DEFAULT NULL');
            console.log('Added reset_expires column.');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('reset_expires column already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
