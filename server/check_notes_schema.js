const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkNotes() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [columns] = await connection.execute("SHOW COLUMNS FROM notes_history");
        const output = columns.map(col => `- ${col.Field} (${col.Type})`).join('\n');
        fs.writeFileSync('schema_output.txt', output);
        console.log("Schema written to schema_output.txt");
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await connection.end();
    }
}

checkNotes();
