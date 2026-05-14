-- Track physical tute delivery
CREATE TABLE IF NOT EXISTS student_tutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id INTEGER NOT NULL,
    tute_id INTEGER NOT NULL,
    received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Received', -- Received, Pending
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(tute_id) REFERENCES tutes(id) ON DELETE CASCADE,
    UNIQUE(student_id, tute_id)
);

-- Add WhatsApp Group URL to classes
ALTER TABLE classes ADD COLUMN whatsapp_group_url TEXT;
