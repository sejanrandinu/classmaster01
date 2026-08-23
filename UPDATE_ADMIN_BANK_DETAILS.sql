-- First, ensure the columns exist in the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder_name TEXT;

-- Update the admin profile with bank details
-- Replace these values with your actual bank details
UPDATE public.profiles 
SET 
  bank_name = 'Bank of Ceylon (BOC)',  -- Change this to your bank name
  account_number = '86019560',  -- Change this to your account number
  account_holder_name = 'B.L Ruwan Manjula'  -- Change this to your name
WHERE email = 'superadmin@classmastertms.com';

-- Verify the update
SELECT email, bank_name, account_number, account_holder_name 
FROM public.profiles 
WHERE email = 'superadmin@classmastertms.com';
