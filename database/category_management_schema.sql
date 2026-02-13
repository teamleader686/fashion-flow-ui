-- ============================================================================
-- CATEGORY MANAGEMENT SYSTEM
-- ============================================================================
-- Complete category management with product relationships and RLS policies
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
-- UPDATE PRODUCTS TABLE (Add category relationship)
-- ============================================================================

-- Add category_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_products_category_id ON products(category_id);
    END IF;
END $$;

-- Migrate existing category data (if products have text-based category)
DO $$
DECLARE
    cat_record RECORD;
    prod_record RECORD;
    products_table_exists BOOLEAN;
    category_column_exists BOOLEAN;
BEGIN
    -- Check if products table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products' AND table_schema = 'public'
    ) INTO products_table_exists;
    
    IF products_table_exists THEN
        -- Check if products table has old 'category' text column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category' AND data_type = 'text'
        ) INTO category_column_exists;
        
        IF category_column_exists THEN
            -- Get distinct categories from products
            FOR cat_record IN 
                SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''
            LOOP
                -- Insert category if not exists
                INSERT INTO categories (name, slug, status)
                VALUES (
                    INITCAP(cat_record.category),
                    LOWER(REPLACE(TRIM(cat_record.category), ' ', '-')),
                    'active'
                )
                ON CONFLICT (slug) DO NOTHING;
                
                -- Update products with category_id
                UPDATE products p
                SET category_id = c.id
                FROM categories c
                WHERE LOWER(TRIM(p.category)) = LOWER(c.name)
                AND p.category_id IS NULL;
            END LOOP;
            
            RAISE NOTICE 'Category migration completed';
        ELSE
            RAISE NOTICE 'Products table exists but no text category column found - skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'Products table does not exist yet - skipping migration';
    END IF;
END $$;

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

-- Function to check if category can be deleted
CREATE OR REPLACE FUNCTION can_delete_category(p_category_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count
    FROM products
    WHERE category_id = p_category_id;
    
    RETURN product_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get product count for category
CREATE OR REPLACE FUNCTION get_category_product_count(p_category_id UUID)
RETURNS INTEGER AS $$
DECLARE
    product_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count
    FROM products
    WHERE category_id = p_category_id;
    
    RETURN product_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reassign products before category deletion
CREATE OR REPLACE FUNCTION reassign_category_products(
    p_old_category_id UUID,
    p_new_category_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE products
    SET category_id = p_new_category_id,
        updated_at = NOW()
    WHERE category_id = p_old_category_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active categories (public access)
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
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Categories with product count
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
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug, c.description, c.image_url, c.status, c.display_order, c.created_at, c.updated_at
ORDER BY c.display_order, c.name;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE categories IS 'Product categories with status management';
COMMENT ON COLUMN categories.status IS 'Category status: active or inactive';
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories (lower = first)';
COMMENT ON FUNCTION can_delete_category IS 'Check if category has no products assigned';
COMMENT ON FUNCTION get_category_product_count IS 'Get number of products in a category';
COMMENT ON FUNCTION reassign_category_products IS 'Move all products from one category to another';

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
SELECT proname, pg_get_functiondef(oid) as definition
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
    RAISE NOTICE 'Functions: 4 created ✓';
    RAISE NOTICE 'Triggers: 1 created ✓';
    RAISE NOTICE 'RLS Policies: 5 created ✓';
    RAISE NOTICE 'Default Categories: 8 inserted ✓';
    RAISE NOTICE 'Views: 1 created ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
END $$;
