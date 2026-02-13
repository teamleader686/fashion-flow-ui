-- ============================================================================
-- SUPER SIMPLE CATEGORY FIX
-- ============================================================================
-- Copy this ENTIRE script and run in Supabase SQL Editor
-- ============================================================================

-- Add status column (this is the one causing error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'status'
    ) THEN
        ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add description column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'description'
    ) THEN
        ALTER TABLE categories ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add image_url column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE categories ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add display_order column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add updated_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update NULL values
UPDATE categories SET status = 'active' WHERE status IS NULL;
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;

-- Make status NOT NULL
ALTER TABLE categories ALTER COLUMN status SET NOT NULL;
ALTER TABLE categories ALTER COLUMN status SET DEFAULT 'active';

-- Add constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check CHECK (status IN ('active', 'inactive'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Show success message
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count 
    FROM information_schema.columns 
    WHERE table_name = 'categories';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORIES TABLE COLUMNS ADDED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total columns: %', col_count;
    RAISE NOTICE 'Status column: EXISTS';
    RAISE NOTICE '========================================';
END $$;

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;
