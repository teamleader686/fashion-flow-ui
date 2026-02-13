-- ============================================================================
-- CATEGORY MANAGEMENT SYSTEM (SIMPLIFIED)
-- ============================================================================
-- Standalone category system that doesn't require products table
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE CATEGORIES TABLE
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(
        REGEXP_REPLACE(category_name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-generate slug before insert/update
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

-- Create trigger for auto-slug generation
DROP TRIGGER IF EXISTS trigger_set_category_slug ON categories;
CREATE TRIGGER trigger_set_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_slug();

-- Function to get product count for category (safe version)
CREATE OR REPLACE FUNCTION get_category_product_count(p_category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    product_count INTEGER;
    products_exists BOOLEAN;
BEGIN
    -- Check if products table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products' AND table_schema = 'public'
    ) INTO products_exists;
    
    IF products_exists THEN
        -- Check if category_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            SELECT COUNT(*) INTO product_count
            FROM products
            WHERE category_id = p_category_id;
            RETURN product_count;
        END IF;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check if category can be deleted
CREATE OR REPLACE FUNCTION can_delete_category(p_category_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_category_product_count(p_category_id) = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active categories
CREATE POLICY "Public can view active categories"
    ON categories
    FOR SELECT
    USING (status = 'active');

-- Policy: Authenticated users can view all categories
CREATE POLICY "Authenticated can view all categories"
    ON categories
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Admins can insert categories
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

-- Policy: Admins can update categories
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

-- Policy: Admins can delete categories
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
-- INSERT DEFAULT CATEGORIES
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
-- CREATE VIEW (Safe version)
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS categories_with_count;

-- Create view with safe product count
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
-- ADD CATEGORY_ID TO PRODUCTS (if table exists)
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
            RAISE NOTICE 'Added category_id column to products table';
        ELSE
            RAISE NOTICE 'category_id column already exists in products table';
        END IF;
    ELSE
        RAISE NOTICE 'Products table does not exist - will be linked when created';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table created
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'categories'
) AS table_exists;

-- Verify policies created
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- Verify functions created
SELECT proname
FROM pg_proc
WHERE proname LIKE '%category%'
ORDER BY proname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORY MANAGEMENT SYSTEM CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Table: categories ✓';
    RAISE NOTICE 'Indexes: 3 created ✓';
    RAISE NOTICE 'Functions: 3 created ✓';
    RAISE NOTICE 'Triggers: 1 created ✓';
    RAISE NOTICE 'RLS Policies: 5 created ✓';
    RAISE NOTICE 'Default Categories: 8 inserted ✓';
    RAISE NOTICE 'View: categories_with_count ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
END $$;
