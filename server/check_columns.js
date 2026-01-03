const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [columns] = await pool.execute("SHOW COLUMNS FROM users");
        console.log("Columns in users table:");
        columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await pool.end();
    }
}

checkColumns();
