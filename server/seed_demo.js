const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const password = await bcrypt.hash('password123', 10);

        console.log('Seeding demo accounts...');

        // Insert User
        await connection.execute(
            'INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)',
            ['demo_user', 'user@demo.com', password]
        );

        // Insert Admin
        await connection.execute(
            'INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)',
            ['demo_admin', 'admin@demo.com', password]
        );

        console.log('Demo accounts created successfully.');
        console.log('User: user@demo.com / password123');
        console.log('Admin: admin@demo.com / password123');
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seed().catch(err => {
    console.error('Unhandled error during seeding:', err);
    process.exit(1);
});
