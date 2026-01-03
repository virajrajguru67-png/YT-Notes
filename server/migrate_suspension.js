const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate_suspension() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Adding suspended_until column to users table...');
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN suspended_until DATETIME DEFAULT NULL
            `);
            console.log("Column 'suspended_until' added successfully.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'suspended_until' already exists.");
            } else {
                throw e;
            }
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate_suspension();
