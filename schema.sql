-- ClassMaster D1 Schema (SQLite)

-- 1. Profiles (Authentication & User Details)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Using UUID string
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    whatsapp_number TEXT,
    role TEXT DEFAULT 'pending', -- super-admin, admin, teacher, clerk, pending
    is_approved BOOLEAN DEFAULT 0,
    bank_name TEXT,
    account_number TEXT,
    account_holder_name TEXT,
    card_background_url TEXT,
    card_theme_color TEXT DEFAULT '#0d124d',
    card_layout_type TEXT DEFAULT 'standard',
    card_show_visuals INTEGER DEFAULT 1,
    is_email_verified INTEGER DEFAULT 1,
    verification_token TEXT,
    trial_ends_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id TEXT,
    name TEXT NOT NULL,
    school TEXT,
    grade TEXT,
    contact TEXT,
    status TEXT DEFAULT 'Active',
    subjects_json TEXT, -- Store as JSON array string
    image_url TEXT,
    color_theme TEXT,
    layout_type TEXT DEFAULT 'standard',
    show_visuals INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 3. Tutors
CREATE TABLE IF NOT EXISTS tutors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    subject TEXT,
    email TEXT,
    phone TEXT,
    grades_json TEXT, -- Added
    bank_name TEXT, -- Added
    bank_account_name TEXT, -- Added
    bank_account_number TEXT, -- Added
    bank_branch TEXT, -- Added
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 4. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 5. Classes 
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tutor_id INTEGER,
    subject_id INTEGER,
    tutor_name TEXT, -- Added for easier fetching
    subject_name TEXT, -- Added for easier fetching
    grade TEXT,
    day TEXT,
    class_date DATE, -- Added
    start_time TEXT,
    end_time TEXT,
    fee DECIMAL(10, 2),
    status TEXT DEFAULT 'Active', -- Added
    recurrence_type TEXT DEFAULT 'weekly', -- Added: weekly, biweekly, monthly, none
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 6. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id INTEGER,
    class_id INTEGER,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Present',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(student_id, class_id, date) -- Ensure unique attendance per day
);

-- 7. Payments (Fees)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id INTEGER,
    class_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    month TEXT,
    payment_date DATE DEFAULT CURRENT_DATE, -- Renamed for consistency with frontend
    transaction_id TEXT,
    receipt_no TEXT, -- Added
    receipt_url TEXT,
    payment_method TEXT, -- Added
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 8. Messaging Log (Also used for activities)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT,
    recipient_type TEXT, -- Also used as activity type
    recipient_id TEXT,
    recipient_name TEXT, -- Added for history
    status TEXT, -- 'Sent', 'Failed', 'Log'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 9. Staff & Salary
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    whatsapp_number TEXT,
    salary DECIMAL(10, 2),
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    staff_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- 10. Custom Roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    permissions_json TEXT, -- Store as JSON array string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create some indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_composite ON attendance(student_id, class_id, date);

-- 11. Tutes & Materials
CREATE TABLE IF NOT EXISTS tutes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    grade TEXT,
    subject_name TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_tutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    student_id INTEGER NOT NULL,
    tute_id TEXT NOT NULL,
    status TEXT DEFAULT 'Received',
    received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(tute_id) REFERENCES tutes(id) ON DELETE CASCADE,
    UNIQUE(student_id, tute_id)
);

-- 12. Exams & Results
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    subject_name TEXT,
    date TEXT NOT NULL,
    max_marks INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    student_id INTEGER NOT NULL,
    marks_obtained REAL NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(exam_id, student_id)
);

-- 13. System Notifications
CREATE TABLE IF NOT EXISTS system_notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    content TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

