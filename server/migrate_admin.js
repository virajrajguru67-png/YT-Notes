const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Adding role column to users table...');

        // Add role column if it doesn't exist
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'
            `);
            console.log("Column 'role' added successfully.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'role' already exists.");
            } else {
                throw e;
            }
        }

        console.log("Promoting 'admin@demo.com' to admin role...");
        const [result] = await connection.execute(`
            UPDATE users SET role = 'admin' WHERE email = 'admin@demo.com'
        `);

        if (result.affectedRows > 0) {
            console.log("Admin promoted successfully.");
        } else {
            console.log("Admin user 'admin@demo.com' not found. Please run seed script first.");
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
