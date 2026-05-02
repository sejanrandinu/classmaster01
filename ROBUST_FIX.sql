-- ROBUST SCHEMA FIX
-- This script adds columns one by one.
-- If a column already exists, the statement will fail, but you can ignore it.

-- Profiles table
ALTER TABLE profiles ADD COLUMN bank_name TEXT;
ALTER TABLE profiles ADD COLUMN account_number TEXT;
ALTER TABLE profiles ADD COLUMN account_holder_name TEXT;
ALTER TABLE profiles ADD COLUMN card_background_url TEXT;
ALTER TABLE profiles ADD COLUMN card_theme_color TEXT DEFAULT '#0d124d';
ALTER TABLE profiles ADD COLUMN card_layout_type TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN card_show_visuals INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN is_email_verified INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN verification_token TEXT;
ALTER TABLE profiles ADD COLUMN trial_ends_at TEXT;

-- Students table
ALTER TABLE students ADD COLUMN image_url TEXT;
ALTER TABLE students ADD COLUMN color_theme TEXT;
ALTER TABLE students ADD COLUMN layout_type TEXT DEFAULT 'standard';
ALTER TABLE students ADD COLUMN show_visuals INTEGER DEFAULT 1;
