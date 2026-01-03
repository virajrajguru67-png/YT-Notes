const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    console.log("Starting migration for Stanza 2 (AI Preferences)...");
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log("Adding columns...");
        await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_tone VARCHAR(50) DEFAULT 'educational'");
        await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_detail_level VARCHAR(50) DEFAULT 'detailed'");
        await pool.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_language VARCHAR(50) DEFAULT 'en'");
        console.log("✅ Columns added successfully.");
    } catch (e) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await pool.end();
    }
}

migrate();
