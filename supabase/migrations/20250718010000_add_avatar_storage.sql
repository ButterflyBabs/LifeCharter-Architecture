-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars storage bucket
-- Note: This is typically done via Supabase Dashboard or API
-- The bucket should be created with:
-- - public: true
-- - fileSizeLimit: 5242880 (5MB)
-- - allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

-- Add comment for documentation
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image in Supabase Storage';
