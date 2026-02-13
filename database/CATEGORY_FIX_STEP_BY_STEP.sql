-- ============================================================================
-- CATEGORY FIX - STEP BY STEP (Run each section separately)
-- ============================================================================
-- Copy and run ONLY ONE section at a time
-- Wait for success message before running next section
-- ============================================================================

-- ============================================================================
-- SECTION 1: Check current table structure
-- ============================================================================
-- Run this first to see what columns exist
-- ============================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 2: Add status column
-- ============================================================================
-- Run this ONLY if status column is missing from Section 1 results
-- ============================================================================

ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'active';

-- ============================================================================
-- SECTION 3: Add other missing columns
-- ============================================================================
-- Run this after Section 2 succeeds
-- ============================================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- SECTION 4: Update existing data
-- ============================================================================
-- Run this after Section 3 succeeds
-- ============================================================================

UPDATE categories SET status = 'active' WHERE status IS NULL;
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;

-- ============================================================================
-- SECTION 5: Add constraints
-- ============================================================================
-- Run this after Section 4 succeeds
-- ============================================================================

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check CHECK (status IN ('active', 'inactive'));
ALTER TABLE categories ALTER COLUMN status SET NOT NULL;
ALTER TABLE categories ALTER COLUMN status SET DEFAULT 'active';

-- ============================================================================
-- SECTION 6: Create indexes
-- ============================================================================
-- Run this after Section 5 succeeds
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- SECTION 7: Verify table structure
-- ============================================================================
-- Run this to confirm all columns exist
-- ============================================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- You should see these columns:
-- id, name, slug, description, image_url, status, display_order, created_at, updated_at

-- ============================================================================
-- SECTION 8: Insert default categories
-- ============================================================================
-- Run this ONLY after confirming all columns exist in Section 7
-- ============================================================================

INSERT INTO categories (name, slug, status, display_order)
VALUES 
    ('Kurtis', 'kurtis', 'active', 1),
    ('Dresses', 'dresses', 'active', 2),
    ('Sarees', 'sarees', 'active', 3),
    ('Sets', 'sets', 'active', 4),
    ('Tops', 'tops', 'active', 5),
    ('Bottoms', 'bottoms', 'active', 6),
    ('Ethnic Wear', 'ethnic-wear', 'active', 7),
    ('Western Wear', 'western-wear', 'active', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SECTION 9: Verify categories inserted
-- ============================================================================
-- Run this to see all categories
-- ============================================================================

SELECT id, name, slug, status, display_order FROM categories ORDER BY display_order;

-- You should see 8 categories

-- ============================================================================
-- DONE! Now continue with functions and views...
-- ============================================================================
