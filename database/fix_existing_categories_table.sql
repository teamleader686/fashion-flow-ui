-- ============================================================================
-- FIX EXISTING CATEGORIES TABLE
-- ============================================================================
-- Yeh script existing categories table ko fix karega
-- ============================================================================

-- Step 1: Check current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Step 2: Add missing columns if they don't exist

-- Add status column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'status'
    ) THEN
        ALTER TABLE categories ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
        RAISE NOTICE '✓ Added status column';
    ELSE
        RAISE NOTICE '○ status column already exists';
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
        RAISE NOTICE '✓ Added description column';
    ELSE
        RAISE NOTICE '○ description column already exists';
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
        RAISE NOTICE '✓ Added image_url column';
    ELSE
        RAISE NOTICE '○ image_url column already exists';
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
        RAISE NOTICE '✓ Added display_order column';
    ELSE
        RAISE NOTICE '○ display_order column already exists';
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
        RAISE NOTICE '✓ Added updated_at column';
    ELSE
        RAISE NOTICE '○ updated_at column already exists';
    END IF;
END $$;

-- Step 3: Add constraint for status
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check CHECK (status IN ('active', 'inactive'));

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Step 5: Insert default categories (if not exist)
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

-- Step 6: Create functions
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

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS trigger_set_category_slug ON categories;
CREATE TRIGGER trigger_set_category_slug
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_slug();

-- Step 8: Create view
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

-- Step 9: Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 10: Drop old policies
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can view all categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Step 11: Create new policies
CREATE POLICY "Public can view active categories"
ON categories FOR SELECT
USING (status = 'active');

CREATE POLICY "Authenticated can view all categories"
ON categories FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Step 12: Link to products table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
            CREATE INDEX idx_products_category_id ON products(category_id);
            RAISE NOTICE '✓ Linked products table';
        END IF;
    END IF;
END $$;

-- Success message
DO $$
DECLARE
    cat_count INTEGER;
    col_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cat_count FROM categories;
    SELECT COUNT(*) INTO col_count FROM information_schema.columns WHERE table_name = 'categories';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'categories';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   CATEGORIES TABLE FIXED! ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns: %', col_count;
    RAISE NOTICE 'Categories: %', cat_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE 'View: categories_with_count ✓';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Navigate to: /admin/categories';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
