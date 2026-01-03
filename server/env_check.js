const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('--- ENVIRONMENT DIAGNOSIS ---');
console.log('DB_HOST:', process.env.DB_HOST || '(NOT SET)');
console.log('DB_USER:', process.env.DB_USER || '(NOT SET)');
console.log('DB_NAME:', process.env.DB_NAME || '(NOT SET)');
console.log('SMTP_USER:', process.env.SMTP_USER || '(NOT SET)');
console.log('PORT:', process.env.PORT || '(NOT SET)');

async function checkConn() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('SUCCESS: Database connection established.');
        await connection.end();
    } catch (err) {
        console.error('ERROR: Database connection failed:', err.message);
    }
}

checkConn();
