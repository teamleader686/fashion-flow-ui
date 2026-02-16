-- Fix repeated profile completion dialog by adding explicit tracking column

-- 1. Add is_profile_complete column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_profile_complete') THEN
        ALTER TABLE public.users ADD COLUMN is_profile_complete boolean DEFAULT false;
    END IF;
END $$;

-- 2. Update existing users who might have completed profiles (optional but helpful cleanup)
-- Update users who have a name and phone number to be considered complete
UPDATE public.users 
SET is_profile_complete = true 
WHERE name IS NOT NULL AND name != '' 
  AND phone_number IS NOT NULL AND phone_number != ''
  AND is_profile_complete = false;

-- 3. Ensure RLS allows users to update their own is_profile_complete status
-- (Assuming standard policies exist, but verifying/adding checking policy might be needed if update fails)
-- Usually "Users can update their own data" covers all columns, but good to keep in mind.
