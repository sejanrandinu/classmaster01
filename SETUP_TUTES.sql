-- 11. Tutes (Educational Materials)
CREATE TABLE IF NOT EXISTS tutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    class_name TEXT, -- Linked by name for simplicity consistent with other tables
    subject_name TEXT,
    file_url TEXT, -- URL to the file
    file_type TEXT, -- pdf, docx, link, video
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tutes_user_id ON tutes(user_id);
