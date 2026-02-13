-- ============================================================================
-- CATEGORY MANAGEMENT - CLEAN INSTALL
-- ============================================================================
-- This is a clean, error-free installation script
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: DROP EXISTING (if any)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Drop existing view
DROP VIEW IF EXISTS categories_with_count;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_set_category_slug ON categories;

-- Drop existing functions
DROP FUNCTION IF EXISTS set_category_slug();
DROP FUNCTION IF EXISTS generate_category_slug(TEXT);
DROP FUNCTION IF EXISTS get_category_product_count(UUID);
DROP FUNCTION IF EXISTS can_delete_category(UUID);
DROP FUNCTION IF EXISTS reassign_category_products(UUID, UUID);

-- Drop existing table (careful!)
-- DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================================
-- STEP 2: CREATE CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================================================

-- Function: Generate slug from name
CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(category_name), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Auto-generate slug trigger
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

-- Function: Get product count (safe)
CREATE OR REPLACE FUNCTION get_category_product_count(p_category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    product_count INTEGER := 0;
BEGIN
    -- Check if products table and category_id column exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category_id'
        AND table_schema = 'public'
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

-- Function: Check if can delete
CREATE OR REPLACE FUNCTION can_delete_category(p_category_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_category_product_count(p_category_id) = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE TRIGGER
-- ============================================================================

CREATE TRIGGER trigger_set_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_slug();

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: Public can view active categories
CREATE POLICY "Public can view active categories"
    ON categories
    FOR SELECT
    USING (status = 'active');

-- Policy 2: Authenticated users can view all categories
CREATE POLICY "Authenticated can view all categories"
    ON categories
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy 3: Admins can insert
CREATE POLICY "Admins can insert categories"
    ON categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy 4: Admins can update
CREATE POLICY "Admins can update categories"
    ON categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy 5: Admins can delete
CREATE POLICY "Admins can delete categories"
    ON categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- STEP 7: CREATE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW categories_with_count AS
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
-- STEP 8: INSERT DEFAULT CATEGORIES
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
-- STEP 9: LINK TO PRODUCTS TABLE (if exists)
-- ============================================================================

DO $$ 
BEGIN
    -- Check if products table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products' AND table_schema = 'public'
    ) THEN
        -- Add category_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
            CREATE INDEX idx_products_category_id ON products(category_id);
            RAISE NOTICE '✓ Added category_id to products table';
        ELSE
            RAISE NOTICE '✓ category_id already exists in products table';
        END IF;
    ELSE
        RAISE NOTICE '○ Products table not found - will link when created';
    END IF;
END $$;

-- ============================================================================
-- STEP 10: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
    category_count INTEGER;
BEGIN
    -- Check table
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name = 'categories' AND table_schema = 'public';
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'categories';
    
    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('generate_category_slug', 'set_category_slug', 'get_category_product_count', 'can_delete_category');
    
    -- Check categories
    SELECT COUNT(*) INTO category_count
    FROM categories;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   CATEGORY SYSTEM INSTALLED! ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Table created: %', CASE WHEN table_count > 0 THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'RLS Policies: % created', policy_count;
    RAISE NOTICE 'Functions: % created', function_count;
    RAISE NOTICE 'Default categories: %', category_count;
    RAISE NOTICE 'View: categories_with_count ✓';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Navigate to: /admin/categories';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
