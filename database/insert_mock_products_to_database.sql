-- ============================================================================
-- INSERT MOCK PRODUCTS INTO DATABASE
-- ============================================================================
-- This script migrates all mock data from mockData.ts to Supabase
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. INSERT CATEGORIES
-- ============================================================================

INSERT INTO public.categories (name, slug, description, is_active, display_order) VALUES
('Kurtis', 'kurtis', 'Traditional and modern kurtis for every occasion', true, 1),
('Dresses', 'dresses', 'Stylish dresses for casual and formal wear', true, 2),
('Sarees', 'sarees', 'Elegant sarees in various fabrics and designs', true, 3),
('Sets', 'sets', 'Coordinated ethnic sets and co-ord sets', true, 4),
('Tops', 'tops', 'Trendy tops and tunics', true, 5),
('Ethnic', 'ethnic', 'Traditional ethnic wear collection', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. INSERT PRODUCTS
-- ============================================================================

-- Product 1: Red Embroidered Anarkali Kurti
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Red Embroidered Anarkali Kurti',
    'red-embroidered-anarkali-kurti',
    'Beautiful red anarkali kurti with intricate gold embroidery. Perfect for festive occasions and celebrations. Made from premium georgette fabric with a flattering flared silhouette. Features delicate hand-embroidered patterns that add elegance to your look.',
    'Beautiful red anarkali kurti with intricate gold embroidery',
    1299.00,
    2999.00,
    800.00,
    (SELECT id FROM public.categories WHERE slug = 'kurtis' LIMIT 1),
    'RED-ANK-001',
    45,
    5,
    'StyleBazaar',
    'Georgette',
    true,
    false,
    false,
    true,
    'Red Embroidered Anarkali Kurti - Buy Online',
    'Shop beautiful red anarkali kurti with gold embroidery. Premium georgette fabric, perfect for festive occasions.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 2: Blue Printed Cotton Kurti Set
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Blue Printed Cotton Kurti Set',
    'blue-printed-cotton-kurti-set',
    'Comfortable blue printed cotton kurti with palazzo pants. Ideal for daily wear with a touch of elegance. Breathable cotton fabric for all-day comfort. Features beautiful floral prints and comes with matching palazzo pants.',
    'Comfortable blue printed cotton kurti with palazzo pants',
    899.00,
    1799.00,
    550.00,
    (SELECT id FROM public.categories WHERE slug = 'kurtis' LIMIT 1),
    'BLUE-CTN-002',
    78,
    5,
    'StyleBazaar',
    'Cotton',
    false,
    false,
    false,
    true,
    'Blue Printed Cotton Kurti Set - Comfortable Daily Wear',
    'Buy blue printed cotton kurti set with palazzo. Breathable fabric, perfect for daily wear.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 3: Green Silk Saree with Gold Border
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Green Silk Saree with Gold Border',
    'green-silk-saree-gold-border',
    'Luxurious green silk saree with traditional gold zari border. A timeless piece for weddings and special occasions. Made from pure silk with intricate gold work on the border and pallu. Comes with matching blouse piece.',
    'Luxurious green silk saree with traditional gold zari border',
    2499.00,
    5999.00,
    1500.00,
    (SELECT id FROM public.categories WHERE slug = 'sarees' LIMIT 1),
    'GRN-SILK-003',
    22,
    5,
    'StyleBazaar',
    'Pure Silk',
    false,
    true,
    false,
    true,
    'Green Silk Saree with Gold Border - Wedding Collection',
    'Shop luxurious green silk saree with gold zari border. Perfect for weddings and special occasions.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 4: Yellow Floral Print Summer Dress
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Yellow Floral Print Summer Dress',
    'yellow-floral-print-dress',
    'Cheerful yellow floral printed cotton dress. Perfect for summer outings. Features comfortable A-line silhouette with pockets. Made from breathable cotton fabric with vibrant floral prints. Ideal for casual wear and beach outings.',
    'Cheerful yellow floral printed cotton dress',
    699.00,
    1499.00,
    400.00,
    (SELECT id FROM public.categories WHERE slug = 'dresses' LIMIT 1),
    'YLW-FLR-004',
    120,
    10,
    'StyleBazaar',
    'Cotton',
    true,
    false,
    true,
    true,
    'Yellow Floral Print Summer Dress - Casual Wear',
    'Buy yellow floral printed cotton dress. Comfortable A-line silhouette, perfect for summer.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 5: Maroon Embroidered Ethnic Set
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Maroon Embroidered Ethnic Set',
    'maroon-embroidered-ethnic-set',
    'Elegant maroon embroidered ethnic dress set. Perfect for festive gatherings. Rich embroidery with comfortable fit. Includes kurta, palazzo, and dupatta. Made from premium fabric with intricate thread work.',
    'Elegant maroon embroidered ethnic dress set',
    1899.00,
    3999.00,
    1100.00,
    (SELECT id FROM public.categories WHERE slug = 'sets' LIMIT 1),
    'MRN-ETH-005',
    35,
    5,
    'StyleBazaar',
    'Georgette',
    false,
    false,
    false,
    true,
    'Maroon Embroidered Ethnic Set - Festive Collection',
    'Shop maroon embroidered ethnic set. Perfect for festive gatherings with rich embroidery.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 6: White Chikankari Embroidered Kurti
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'White Chikankari Embroidered Kurti',
    'white-chikankari-kurti',
    'Classic white Lucknowi chikankari kurti. Delicate hand-embroidered patterns on premium cotton fabric. Versatile for office and casual wear. Features traditional chikankari work with elegant design. Comfortable and breathable.',
    'Classic white Lucknowi chikankari kurti',
    999.00,
    2299.00,
    600.00,
    (SELECT id FROM public.categories WHERE slug = 'kurtis' LIMIT 1),
    'WHT-CHK-006',
    60,
    5,
    'StyleBazaar',
    'Cotton',
    false,
    true,
    false,
    true,
    'White Chikankari Embroidered Kurti - Lucknowi Work',
    'Buy white chikankari kurti with hand embroidery. Perfect for office and casual wear.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 7: Pink Georgette Sharara Set
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Pink Georgette Sharara Set',
    'pink-georgette-sharara-set',
    'Stunning pink georgette sharara set with dupatta. Perfect wedding guest outfit with delicate embroidery and flowing fabric. Includes embroidered kurta, sharara pants, and matching dupatta. Made from premium georgette.',
    'Stunning pink georgette sharara set with dupatta',
    2199.00,
    4499.00,
    1300.00,
    (SELECT id FROM public.categories WHERE slug = 'sets' LIMIT 1),
    'PNK-SHR-007',
    18,
    5,
    'StyleBazaar',
    'Georgette',
    true,
    false,
    false,
    true,
    'Pink Georgette Sharara Set - Wedding Collection',
    'Shop pink georgette sharara set. Perfect wedding guest outfit with delicate embroidery.'
) ON CONFLICT (slug) DO NOTHING;

-- Product 8: Navy Blue Embroidered A-Line Kurta
INSERT INTO public.products (
    name, slug, description, short_description,
    price, compare_at_price, cost_per_item,
    category_id, sku, stock_quantity, low_stock_threshold,
    brand, material,
    is_featured, is_new_arrival, is_bestseller, is_active,
    meta_title, meta_description
) VALUES (
    'Navy Blue Embroidered A-Line Kurta',
    'navy-blue-a-line-kurta',
    'Sophisticated navy blue A-line kurta with subtle gold embroidery. Perfect for office wear. Premium cotton blend fabric. Features elegant design with comfortable fit. Suitable for both formal and casual occasions.',
    'Sophisticated navy blue A-line kurta with subtle gold embroidery',
    799.00,
    1699.00,
    480.00,
    (SELECT id FROM public.categories WHERE slug = 'kurtis' LIMIT 1),
    'NVY-ALN-008',
    95,
    10,
    'StyleBazaar',
    'Cotton Blend',
    false,
    false,
    false,
    true,
    'Navy Blue Embroidered A-Line Kurta - Office Wear',
    'Buy navy blue A-line kurta with gold embroidery. Perfect for office wear.'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. INSERT PRODUCT IMAGES
-- ============================================================================
-- Note: You'll need to upload actual images to Supabase Storage
-- For now, using placeholder URLs

DO $$
DECLARE
    product_id UUID;
BEGIN
    -- Product 1 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'red-embroidered-anarkali-kurti' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Red Embroidered Anarkali Kurti', 0, true);
    END IF;

    -- Product 2 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'blue-printed-cotton-kurti-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Blue Printed Cotton Kurti Set', 0, true);
    END IF;

    -- Product 3 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'green-silk-saree-gold-border' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Green Silk Saree with Gold Border', 0, true);
    END IF;

    -- Product 4 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'yellow-floral-print-dress' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Yellow Floral Print Summer Dress', 0, true);
    END IF;

    -- Product 5 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'maroon-embroidered-ethnic-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Maroon Embroidered Ethnic Set', 0, true);
    END IF;

    -- Product 6 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'white-chikankari-kurti' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'White Chikankari Embroidered Kurti', 0, true);
    END IF;

    -- Product 7 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'pink-georgette-sharara-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Pink Georgette Sharara Set', 0, true);
    END IF;

    -- Product 8 Images
    SELECT id INTO product_id FROM public.products WHERE slug = 'navy-blue-a-line-kurta' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
        VALUES (product_id, '/placeholder.svg', 'Navy Blue Embroidered A-Line Kurta', 0, true);
    END IF;
END $$;

-- ============================================================================
-- 4. INSERT PRODUCT VARIANTS (Sizes and Colors)
-- ============================================================================

DO $$
DECLARE
    product_id UUID;
    sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL'];
    size_val TEXT;
BEGIN
    -- Product 1 Variants (Red Anarkali)
    SELECT id INTO product_id FROM public.products WHERE slug = 'red-embroidered-anarkali-kurti' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY sizes LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Red', '#CC0000', 9, true);
        END LOOP;
    END IF;

    -- Product 2 Variants (Blue Kurti)
    SELECT id INTO product_id FROM public.products WHERE slug = 'blue-printed-cotton-kurti-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY ARRAY['S', 'M', 'L', 'XL'] LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Blue', '#2563EB', 19, true);
        END LOOP;
    END IF;

    -- Product 3 Variants (Green Saree - Free Size)
    SELECT id INTO product_id FROM public.products WHERE slug = 'green-silk-saree-gold-border' LIMIT 1;
    IF product_id IS NOT NULL THEN
        INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
        VALUES (product_id, 'Free Size', 'Green', '#166534', 22, true);
    END IF;

    -- Product 4 Variants (Yellow Dress)
    SELECT id INTO product_id FROM public.products WHERE slug = 'yellow-floral-print-dress' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY ARRAY['XS', 'S', 'M', 'L', 'XL'] LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Yellow', '#EAB308', 24, true);
        END LOOP;
    END IF;

    -- Product 5 Variants (Maroon Set)
    SELECT id INTO product_id FROM public.products WHERE slug = 'maroon-embroidered-ethnic-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY ARRAY['S', 'M', 'L', 'XL'] LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Maroon', '#7F1D1D', 8, true);
        END LOOP;
    END IF;

    -- Product 6 Variants (White Kurti)
    SELECT id INTO product_id FROM public.products WHERE slug = 'white-chikankari-kurti' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY sizes LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'White', '#FAFAFA', 12, true);
        END LOOP;
    END IF;

    -- Product 7 Variants (Pink Sharara)
    SELECT id INTO product_id FROM public.products WHERE slug = 'pink-georgette-sharara-set' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY ARRAY['S', 'M', 'L', 'XL'] LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Pink', '#EC4899', 4, true);
        END LOOP;
    END IF;

    -- Product 8 Variants (Navy Kurta)
    SELECT id INTO product_id FROM public.products WHERE slug = 'navy-blue-a-line-kurta' LIMIT 1;
    IF product_id IS NOT NULL THEN
        FOREACH size_val IN ARRAY sizes LOOP
            INSERT INTO public.product_variants (product_id, size, color, color_code, stock_quantity, is_available)
            VALUES (product_id, size_val, 'Navy Blue', '#1E3A5F', 19, true);
        END LOOP;
    END IF;
END $$;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check categories
SELECT COUNT(*) as category_count FROM public.categories;

-- Check products
SELECT COUNT(*) as product_count FROM public.products;

-- Check product images
SELECT COUNT(*) as image_count FROM public.product_images;

-- Check product variants
SELECT COUNT(*) as variant_count FROM public.product_variants;

-- View all products with details
SELECT 
    p.name,
    p.slug,
    p.price,
    p.stock_quantity,
    c.name as category,
    COUNT(DISTINCT pi.id) as image_count,
    COUNT(DISTINCT pv.id) as variant_count
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.product_images pi ON p.id = pi.product_id
LEFT JOIN public.product_variants pv ON p.id = pv.product_id
GROUP BY p.id, p.name, p.slug, p.price, p.stock_quantity, c.name
ORDER BY p.created_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Mock data migration completed successfully!';
    RAISE NOTICE '📦 Products inserted into database';
    RAISE NOTICE '🎨 Product images added';
    RAISE NOTICE '📏 Product variants created';
    RAISE NOTICE '🔄 Now update your frontend to use Supabase instead of mockData.ts';
END $$;

