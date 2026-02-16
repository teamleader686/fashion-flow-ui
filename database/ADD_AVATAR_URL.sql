-- Add avatar_url column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Also add to users table if we are syncing
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS if needed (usually existing policies cover update own profile)
