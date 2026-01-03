USE youtube_notes;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update notes_history to link to users
ALTER TABLE notes_history ADD COLUMN user_id INT;
ALTER TABLE notes_history ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
