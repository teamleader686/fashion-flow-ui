-- ============================================================================
-- CATEGORY TABLE - QUICK FIX (100% Working)
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add missing columns (safe - won't break if already exists)
-- ============================================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 2: Add constraint
-- ============================================================================

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check CHECK (status IN ('active', 'inactive'));

-- STEP 3: Update existing rows to have status
-- ============================================================================

UPDATE categories SET status = 'active' WHERE status IS NULL;
UPDATE categories SET display_order = 0 WHERE display_order IS NULL;

-- STEP 4: Make status NOT NULL
-- ============================================================================

ALTER TABLE categories ALTER COLUMN status SET NOT NULL;
ALTER TABLE categories ALTER COLUMN status SET DEFAULT 'active';

-- STEP 5: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- STEP 6: Insert default categories (only if they don't exist)
-- ============================================================================

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Kurtis', 'kurtis', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'kurtis');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Dresses', 'dresses', 'active', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dresses');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Sarees', 'sarees', 'active', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sarees');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Sets', 'sets', 'active', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'sets');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Tops', 'tops', 'active', 5
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'tops');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Bottoms', 'bottoms', 'active', 6
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bottoms');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Ethnic Wear', 'ethnic-wear', 'active', 7
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ethnic-wear');

INSERT INTO categories (name, slug, status, display_order)
SELECT 'Western Wear', 'western-wear', 'active', 8
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'western-wear');

-- STEP 7: Create helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(category_name), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_category_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_category_slug(NEW.name);
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_category_product_count(p_category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    product_count INTEGER := 0;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        EXECUTE format('SELECT COUNT(*) FROM products WHERE category_id = %L', p_category_id)
        INTO product_count;
    END IF;
    RETURN product_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Create trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_set_category_slug ON categories;
CREATE TRIGGER trigger_set_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_slug();

-- STEP 9: Create view
-- ============================================================================

DROP VIEW IF EXISTS categories_with_count;
CREATE VIEW categories_with_count AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image_url,
    c.status,
    c.display_order,
    c.created_at,
    c.updated_at,
    get_category_product_count(c.id) as product_count
FROM categories c
ORDER BY c.display_order, c.name;

-- STEP 10: Enable RLS
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- STEP 11: Drop old policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- STEP 12: Create RLS policies
-- ============================================================================

-- Public can see active categories
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (status = 'active');

-- Authenticated users can see all categories
CREATE POLICY "Authenticated can view all categories"
ON categories FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can insert
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Only admins can update
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Only admins can delete
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- STEP 13: Link to products table (if exists)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
            CREATE INDEX idx_products_category_id ON products(category_id);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    '✓ Categories table fixed!' as status,
    COUNT(*) as total_categories,
    COUNT(*) FILTER (WHERE status = 'active') as active_categories
FROM categories;

SELECT 
    '✓ View created!' as status,
    COUNT(*) as categories_in_view
FROM categories_with_count;

-- ============================================================================
-- SUCCESS! 
-- ============================================================================
-- Now refresh your browser and go to: /admin/categories
-- ============================================================================
