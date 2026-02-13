-- ============================================================================
-- CATEGORIES - MINIMAL INSTALL (GUARANTEED TO WORK)
-- ============================================================================
-- Run each section one by one if needed
-- ============================================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check CHECK (status IN ('active', 'inactive'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- SECTION 2: INSERT DEFAULT DATA
-- ============================================================================

INSERT INTO categories (name, slug, description, status, display_order)
VALUES
    ('Kurtis', 'kurtis', 'Traditional and modern kurtis', 'active', 1),
    ('Dresses', 'dresses', 'Stylish dresses for all occasions', 'active', 2),
    ('Sarees', 'sarees', 'Elegant sarees collection', 'active', 3),
    ('Sets', 'sets', 'Coordinated outfit sets', 'active', 4),
    ('Tops', 'tops', 'Trendy tops and blouses', 'active', 5),
    ('Bottoms', 'bottoms', 'Pants, skirts, and more', 'active', 6),
    ('Ethnic Wear', 'ethnic-wear', 'Traditional ethnic clothing', 'active', 7),
    ('Western Wear', 'western-wear', 'Modern western outfits', 'active', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SECTION 3: CREATE FUNCTIONS
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
    NEW.updated_at := NOW();
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

-- ============================================================================
-- SECTION 4: CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_set_category_slug ON categories;
CREATE TRIGGER trigger_set_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_slug();

-- ============================================================================
-- SECTION 5: CREATE VIEW
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

-- ============================================================================
-- SECTION 6: ENABLE RLS
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 7: DROP OLD POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- ============================================================================
-- SECTION 8: CREATE NEW POLICIES
-- ============================================================================

-- Policy 1: Public can view active categories
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (status = 'active');

-- Policy 2: Authenticated users can view all
CREATE POLICY "Authenticated can view all categories"
ON categories FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 3: Admins can insert
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Policy 4: Admins can update
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Policy 5: Admins can delete
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- ============================================================================
-- SECTION 9: LINK TO PRODUCTS (if exists)
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
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 
    'Categories table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM categories LIMIT 1) THEN '✓ Created' ELSE '✗ Failed' END as status
UNION ALL
SELECT 
    'Default categories',
    CASE WHEN (SELECT COUNT(*) FROM categories) >= 8 THEN '✓ Inserted' ELSE '✗ Failed' END
UNION ALL
SELECT 
    'View',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'categories_with_count') THEN '✓ Created' ELSE '✗ Failed' END
UNION ALL
SELECT 
    'RLS Policies',
    (SELECT COUNT(*)::TEXT || ' created' FROM pg_policies WHERE tablename = 'categories');
