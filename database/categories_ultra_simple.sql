-- ============================================================================
-- CATEGORIES - ULTRA SIMPLE (NO RLS, NO POLICIES)
-- ============================================================================
-- Sabse pehle yeh run karo, phir policies alag se add karenge
-- ============================================================================

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
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

-- Insert data
INSERT INTO categories (name, slug, status, display_order) VALUES
('Kurtis', 'kurtis', 'active', 1),
('Dresses', 'dresses', 'active', 2),
('Sarees', 'sarees', 'active', 3),
('Sets', 'sets', 'active', 4),
('Tops', 'tops', 'active', 5),
('Bottoms', 'bottoms', 'active', 6),
('Ethnic Wear', 'ethnic-wear', 'active', 7),
('Western Wear', 'western-wear', 'active', 8)
ON CONFLICT (slug) DO NOTHING;

-- Simple function for product count
CREATE OR REPLACE FUNCTION get_category_product_count(p_category_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN 0; -- Temporarily return 0, will update later
END;
$$ LANGUAGE plpgsql;

-- Create view
DROP VIEW IF EXISTS categories_with_count;
CREATE VIEW categories_with_count AS
SELECT 
    id, name, slug, description, image_url, status, 
    display_order, created_at, updated_at,
    0 as product_count
FROM categories
ORDER BY display_order, name;

-- Disable RLS for now (we'll enable later)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Success check
SELECT COUNT(*) as total_categories FROM categories;
