-- ============================================================================
-- PRODUCT SIZE & COLOR VARIANTS SYSTEM
-- ============================================================================
-- This adds support for product sizes and colors in the admin panel
-- ============================================================================

-- STEP 1: Add size and color columns to products table
-- ============================================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS available_sizes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]';

-- STEP 2: Create product_variants table (optional advanced setup)
-- ============================================================================
-- This allows for variant-specific pricing, stock, and images
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Variant Details
    size VARCHAR(50),
    color VARCHAR(50),
    color_hex VARCHAR(7), -- e.g., #FF5733
    
    -- Variant-specific pricing (optional)
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    
    -- Variant-specific stock
    sku VARCHAR(100) UNIQUE,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    
    -- Variant-specific image (optional)
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique size-color combination per product
    UNIQUE(product_id, size, color)
);

-- STEP 3: Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

-- STEP 4: Enable RLS on product_variants
-- ============================================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public to read active variants
CREATE POLICY "Anyone can view active product variants"
ON product_variants FOR SELECT
USING (is_active = true);

-- Allow authenticated users to manage variants
CREATE POLICY "Authenticated users can manage product variants"
ON product_variants FOR ALL
USING (auth.role() = 'authenticated');

-- STEP 5: Create function to update product updated_at on variant change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET updated_at = NOW() 
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_product_on_variant_change ON product_variants;
CREATE TRIGGER trigger_update_product_on_variant_change
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_timestamp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Product variants system installed successfully!';
    RAISE NOTICE '📦 Products table updated with available_sizes and available_colors';
    RAISE NOTICE '🎨 product_variants table created for advanced variant management';
    RAISE NOTICE '🔒 RLS policies configured';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Usage:';
    RAISE NOTICE '   - Simple: Store sizes/colors directly in products table';
    RAISE NOTICE '   - Advanced: Use product_variants for variant-specific pricing/stock';
END $$;
