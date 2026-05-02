-- FINAL SCHEMA FIX FOR PROFILES TABLE
-- Adding missing columns required by the API

-- Check and add columns to profiles table
ALTER TABLE profiles ADD COLUMN is_email_verified INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN verification_token TEXT;
ALTER TABLE profiles ADD COLUMN trial_ends_at TEXT;
ALTER TABLE profiles ADD COLUMN card_background_url TEXT;
ALTER TABLE profiles ADD COLUMN card_theme_color TEXT DEFAULT '#0d124d';
ALTER TABLE profiles ADD COLUMN card_layout_type TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN card_show_visuals INTEGER DEFAULT 1;

-- Also ensure students table has required columns for ID cards
ALTER TABLE students ADD COLUMN image_url TEXT;
ALTER TABLE students ADD COLUMN color_theme TEXT;
ALTER TABLE students ADD COLUMN layout_type TEXT DEFAULT 'standard';
ALTER TABLE students ADD COLUMN show_visuals INTEGER DEFAULT 1;
