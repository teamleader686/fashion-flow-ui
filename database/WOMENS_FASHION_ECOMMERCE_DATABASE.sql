-- ============================================================================
-- WOMEN'S FASHION E-COMMERCE DATABASE STRUCTURE
-- ============================================================================
-- Business: Women's Kurtis & Dresses Online Store
-- Database: PostgreSQL (Supabase)
-- Generated: February 11, 2026
-- Purpose: Complete production-ready database schema for dynamic eCommerce
-- ============================================================================

-- ============================================================================
-- TABLE OF CONTENTS
-- ============================================================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- 2. PRODUCT CATALOG MANAGEMENT
-- 3. SHOPPING CART & CHECKOUT
-- 4. ORDER MANAGEMENT
-- 5. PAYMENT PROCESSING
-- 6. SHIPPING MANAGEMENT
-- 7. MARKETING MODULES (Affiliate, Coupon, Referral, Instagram, Offers)
-- 8. WALLET & LOYALTY SYSTEM
-- 9. WEBSITE SETTINGS & CONFIGURATION
-- 10. INDEXES & PERFORMANCE OPTIMIZATION
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- 12. TRIGGERS & FUNCTIONS
-- ============================================================================


-- ============================================================================
-- SECTION 1: AUTHENTICATION & USER MANAGEMENT
-- ============================================================================

-- 1.1 USER PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Default Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    
    -- User Role
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    
    -- Profile Settings
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('female', 'male', 'other')),
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 1.2 ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    admin_level VARCHAR(20) DEFAULT 'admin' CHECK (admin_level IN ('super_admin', 'admin', 'moderator')),
    permissions JSONB DEFAULT '{"products": true, "orders": true, "users": true, "settings": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 1.3 USER ADDRESSES (Multiple shipping addresses)
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 2: PRODUCT CATALOG MANAGEMENT
-- ============================================================================

-- 2.1 CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price >= price),
    cost_per_item DECIMAL(10,2),
    
    -- Category
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Inventory
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    track_inventory BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Product Details
    brand VARCHAR(100),
    material VARCHAR(100),
    care_instructions TEXT,
    
    -- Product Features
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 2.3 PRODUCT VARIANTS (Size, Color combinations)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Variant Attributes
    size VARCHAR(20), -- XS, S, M, L, XL, XXL, XXXL, Free Size
    color VARCHAR(50),
    color_code VARCHAR(7), -- Hex color code
    
    -- Variant Pricing & Inventory
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    
    -- Variant Image
    image_url TEXT,
    
    -- Status
    is_available BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, size, color)
);

-- 2.4 PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 PRODUCT REVIEWS
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 3: SHOPPING CART & CHECKOUT
-- ============================================================================

-- 3.1 CART
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For guest users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    
    UNIQUE(user_id),
    UNIQUE(session_id)
);

-- 3.2 CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(cart_id, product_id, variant_id)
);

-- 3.3 WISHLIST
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);


-- ============================================================================
-- SECTION 4: ORDER MANAGEMENT
-- ============================================================================

-- 4.1 ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    
    -- Shipping Address
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_landmark TEXT,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_zip VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'India',
    
    -- Billing Address (if different)
    billing_same_as_shipping BOOLEAN DEFAULT true,
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'India',
    
    -- Order Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    wallet_amount_used DECIMAL(10,2) DEFAULT 0,
    loyalty_coins_used INTEGER DEFAULT 0,
    loyalty_coins_value DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Coupon & Loyalty
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    coupon_code VARCHAR(50),
    loyalty_coins_earned INTEGER DEFAULT 0,
    
    -- Marketing Attribution
    affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE SET NULL,
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    instagram_influencer_id UUID REFERENCES public.instagram_influencers(id) ON DELETE SET NULL,
    
    -- Order Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'packed', 
        'shipped', 'out_for_delivery', 'delivered', 
        'cancelled', 'returned', 'refunded'
    )),
    
    -- Payment Status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'partially_paid', 'failed', 'refunded', 'partially_refunded'
    )),
    payment_method VARCHAR(50) DEFAULT 'cod' CHECK (payment_method IN (
        'cod', 'online', 'upi', 'card', 'netbanking', 'wallet'
    )),
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    packed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- 4.2 ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    
    -- Product Details (snapshot at time of order)
    product_name VARCHAR(500) NOT NULL,
    product_image TEXT,
    sku VARCHAR(100),
    size VARCHAR(20),
    color VARCHAR(50),
    
    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Loyalty
    loyalty_coins_earned INTEGER DEFAULT 0,
    
    -- Status
    item_status VARCHAR(20) DEFAULT 'pending' CHECK (item_status IN (
        'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.3 ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 5: PAYMENT PROCESSING
-- ============================================================================

-- 5.1 PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50), -- razorpay, paytm, phonepe, etc.
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Gateway Response
    transaction_id TEXT UNIQUE,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    gateway_response JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- 5.2 REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    
    -- Refund Details
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason TEXT,
    refund_method VARCHAR(50) DEFAULT 'original', -- original, wallet, bank_transfer
    
    -- Gateway Details
    gateway_refund_id TEXT,
    gateway_response JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Admin
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT
);


-- ============================================================================
-- SECTION 6: SHIPPING MANAGEMENT
-- ============================================================================

-- 6.1 SHIPPING ZONES
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(255) NOT NULL UNIQUE,
    states TEXT[] NOT NULL, -- Array of state names
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.2 SHIPPING RATES
CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_order_value DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) NOT NULL,
    estimated_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.3 SHIPMENTS
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    
    -- Shipping Provider
    carrier VARCHAR(100), -- Delhivery, BlueDart, DTDC, India Post, etc.
    tracking_number VARCHAR(255) UNIQUE,
    tracking_url TEXT,
    
    -- Shipment Details
    weight DECIMAL(8,2), -- in kg
    dimensions JSONB, -- {length, width, height}
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'picked_up', 'in_transit', 'out_for_delivery', 
        'delivered', 'failed', 'returned'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    shipping_notes TEXT
);

-- 6.4 SHIPMENT TRACKING EVENTS
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 7: MARKETING MODULES
-- ============================================================================

-- 7.1 COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Discount Configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount DECIMAL(10,2),
    
    -- Applicability
    min_order_value DECIMAL(10,2) DEFAULT 0,
    applicable_on VARCHAR(20) DEFAULT 'all' CHECK (applicable_on IN ('all', 'products', 'categories')),
    
    -- Usage Limits
    total_usage_limit INTEGER,
    per_user_limit INTEGER DEFAULT 1,
    
    -- Validity
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Loyalty Integration
    bonus_loyalty_coins INTEGER DEFAULT 0,
    
    -- Analytics
    total_used INTEGER DEFAULT 0,
    total_discount_given DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7.2 COUPON PRODUCTS (For product-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, product_id)
);

-- 7.3 COUPON CATEGORIES (For category-specific coupons)
CREATE TABLE IF NOT EXISTS public.coupon_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, category_id)
);

-- 7.4 COUPON USAGE
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    order_total DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.5 AFFILIATE USERS
CREATE TABLE IF NOT EXISTS public.affiliate_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    
    -- Affiliate Code
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Commission Settings
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('flat', 'percentage')),
    commission_value DECIMAL(10,2) DEFAULT 5.00,
    
    -- Bank Details
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    
    -- Stats
    total_clicks INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_commission_earned DECIMAL(12,2) DEFAULT 0,
    pending_commission DECIMAL(12,2) DEFAULT 0,
    paid_commission DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.6 AFFILIATE CLICKS
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted BOOLEAN DEFAULT false,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- 7.7 AFFILIATE ORDERS
CREATE TABLE IF NOT EXISTS public.affiliate_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    click_id UUID REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
    
    -- Commission Calculation
    order_amount DECIMAL(10,2) NOT NULL,
    commission_type VARCHAR(20) NOT NULL,
    commission_rate DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 7.8 AFFILIATE PAYOUTS
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'upi', 'manual')),
    transaction_id TEXT,
    payment_details JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 7.9 REFERRALS
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Rewards
    referrer_reward_type VARCHAR(20) CHECK (referrer_reward_type IN ('coins', 'discount', 'cashback')),
    referrer_reward_value DECIMAL(10,2),
    referred_reward_type VARCHAR(20) CHECK (referred_reward_type IN ('coins', 'discount', 'cashback')),
    referred_reward_value DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- 7.10 INSTAGRAM INFLUENCERS
CREATE TABLE IF NOT EXISTS public.instagram_influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    instagram_handle VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    
    -- Influencer Code
    influencer_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Commission Settings
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('flat', 'percentage')),
    commission_value DECIMAL(10,2) DEFAULT 10.00,
    
    -- Stats
    total_clicks INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_commission_earned DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.11 INSTAGRAM CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.instagram_influencers(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_url TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.12 OFFERS (Flash Sales, Limited Time Offers)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_title VARCHAR(255) NOT NULL,
    offer_description TEXT,
    offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('flash_sale', 'seasonal', 'clearance', 'bogo')),
    
    -- Discount Configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount_amount DECIMAL(10,2),
    
    -- Applicability
    applicable_on VARCHAR(20) DEFAULT 'all' CHECK (applicable_on IN ('all', 'products', 'categories')),
    
    -- Validity
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Display
    banner_image TEXT,
    badge_text VARCHAR(50), -- "50% OFF", "FLASH SALE", etc.
    
    -- Analytics
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.13 OFFER PRODUCTS
CREATE TABLE IF NOT EXISTS public.offer_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    offer_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(offer_id, product_id)
);


-- ============================================================================
-- SECTION 8: WALLET & LOYALTY SYSTEM
-- ============================================================================

-- 8.1 WALLET
CREATE TABLE IF NOT EXISTS public.wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    total_credited DECIMAL(12,2) DEFAULT 0.00,
    total_debited DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.2 WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallet(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    balance_after DECIMAL(10,2) NOT NULL,
    
    -- Source
    source VARCHAR(50) NOT NULL, -- refund, cashback, referral, admin_credit, order_payment
    reference_id UUID,
    reference_type VARCHAR(50),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Description
    description TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8.3 LOYALTY COINS
CREATE TABLE IF NOT EXISTS public.loyalty_coins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    available_coins INTEGER DEFAULT 0 CHECK (available_coins >= 0),
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    total_expired INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8.4 LOYALTY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'admin_add', 'admin_deduct')),
    coins INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Conversion Rate (1 coin = X rupees)
    coin_value DECIMAL(10,2) DEFAULT 1.00,
    
    -- Source
    source VARCHAR(50) NOT NULL, -- order, referral, review, admin, coupon
    reference_id UUID,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Description
    description TEXT,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8.5 LOYALTY SETTINGS
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- System Settings
    is_enabled BOOLEAN DEFAULT true,
    coins_per_rupee DECIMAL(5,2) DEFAULT 1.00, -- 1 rupee = 1 coin
    rupees_per_coin DECIMAL(5,2) DEFAULT 1.00, -- 1 coin = 1 rupee
    
    -- Redemption Rules
    min_coins_to_redeem INTEGER DEFAULT 10,
    max_coins_per_order INTEGER DEFAULT 1000,
    max_coins_percentage_per_order INTEGER DEFAULT 50, -- Max 50% of order can be paid with coins
    
    -- Earning Rules
    min_order_value_to_earn DECIMAL(10,2) DEFAULT 0,
    
    -- Expiry
    coins_expiry_days INTEGER DEFAULT 365,
    
    -- Bonus Coins
    signup_bonus_coins INTEGER DEFAULT 50,
    review_bonus_coins INTEGER DEFAULT 10,
    referral_bonus_coins INTEGER DEFAULT 100,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 9: WEBSITE SETTINGS & CONFIGURATION
-- ============================================================================

-- 9.1 WEBSITE SETTINGS
CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    site_name VARCHAR(255) DEFAULT 'Fashion Store',
    site_tagline TEXT,
    site_description TEXT,
    site_logo TEXT,
    site_favicon TEXT,
    
    -- Contact Info
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    support_email VARCHAR(255),
    
    -- Social Media
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    pinterest_url TEXT,
    youtube_url TEXT,
    
    -- Business Address
    business_address TEXT,
    business_city VARCHAR(100),
    business_state VARCHAR(100),
    business_zip VARCHAR(20),
    business_country VARCHAR(100) DEFAULT 'India',
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Features
    enable_cod BOOLEAN DEFAULT true,
    enable_online_payment BOOLEAN DEFAULT true,
    enable_wallet BOOLEAN DEFAULT true,
    enable_loyalty_coins BOOLEAN DEFAULT true,
    enable_reviews BOOLEAN DEFAULT true,
    enable_wishlist BOOLEAN DEFAULT true,
    
    -- Policies
    terms_and_conditions TEXT,
    privacy_policy TEXT,
    return_policy TEXT,
    shipping_policy TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.2 HOMEPAGE BANNERS
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    
    -- Link Configuration
    link_type VARCHAR(20) CHECK (link_type IN ('product', 'category', 'offer', 'external', 'none')),
    link_url TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    
    -- Display Settings
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Button
    button_text VARCHAR(50),
    button_color VARCHAR(7), -- Hex color
    
    -- Timestamps
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.3 SLIDER IMAGES
CREATE TABLE IF NOT EXISTS public.slider_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.4 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- order_placed, order_shipped, payment_success, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Link
    link_url TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.5 EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_subject VARCHAR(255) NOT NULL,
    template_body TEXT NOT NULL,
    template_variables JSONB, -- Available variables for this template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.6 SMS TEMPLATES
CREATE TABLE IF NOT EXISTS public.sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_body TEXT NOT NULL,
    template_variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================================
-- SECTION 10: INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User Profiles
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_phone ON public.user_profiles(phone);

-- Products
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- Product Variants
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);

-- Categories
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);

-- Orders
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);

-- Order Items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Cart
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_cart_session_id ON public.cart(session_id);

-- Cart Items
CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);

-- Payments
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Coupons
CREATE INDEX idx_coupons_coupon_code ON public.coupons(coupon_code);
CREATE INDEX idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_start_date ON public.coupons(start_date);
CREATE INDEX idx_coupons_end_date ON public.coupons(end_date);

-- Coupon Usage
CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_order_id ON public.coupon_usage(order_id);

-- Affiliate
CREATE INDEX idx_affiliate_users_affiliate_code ON public.affiliate_users(affiliate_code);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_orders_affiliate_id ON public.affiliate_orders(affiliate_id);
CREATE INDEX idx_affiliate_orders_order_id ON public.affiliate_orders(order_id);

-- Wallet
CREATE INDEX idx_wallet_user_id ON public.wallet(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);

-- Loyalty
CREATE INDEX idx_loyalty_coins_user_id ON public.loyalty_coins(user_id);
CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_order_id ON public.loyalty_transactions(order_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);


-- ============================================================================
-- SECTION 11: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- User Addresses Policies
CREATE POLICY "Users can manage their own addresses"
    ON public.user_addresses FOR ALL
    USING (auth.uid() = user_id);

-- Products Policies (Public read, admin write)
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Categories Policies
CREATE POLICY "Anyone can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Orders Policies
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Order Items Policies
CREATE POLICY "Users can view their order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Cart Policies
CREATE POLICY "Users can manage their own cart"
    ON public.cart FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.cart
            WHERE cart.id = cart_items.cart_id
            AND cart.user_id = auth.uid()
        )
    );

-- Wishlist Policies
CREATE POLICY "Users can manage their own wishlist"
    ON public.wishlist FOR ALL
    USING (auth.uid() = user_id);

-- Wallet Policies
CREATE POLICY "Users can view their own wallet"
    ON public.wallet FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their wallet transactions"
    ON public.wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Loyalty Coins Policies
CREATE POLICY "Users can view their loyalty coins"
    ON public.loyalty_coins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their loyalty transactions"
    ON public.loyalty_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================================================
-- SECTION 12: TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at
    BEFORE UPDATE ON public.wallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_coins_updated_at
    BEFORE UPDATE ON public.loyalty_coins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Function: Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    -- Create wallet for new user
    INSERT INTO public.wallet (user_id, balance)
    VALUES (NEW.id, 0.00);
    
    -- Create loyalty coins account
    INSERT INTO public.loyalty_coins (user_id, available_coins)
    VALUES (NEW.id, 0);
    
    -- Give signup bonus coins (if enabled in settings)
    INSERT INTO public.loyalty_transactions (
        user_id,
        transaction_type,
        coins,
        balance_after,
        source,
        description
    )
    SELECT
        NEW.id,
        'earned',
        signup_bonus_coins,
        signup_bonus_coins,
        'signup',
        'Welcome bonus coins'
    FROM public.loyalty_settings
    WHERE is_enabled = true AND signup_bonus_coins > 0
    LIMIT 1;
    
    -- Update loyalty coins balance
    UPDATE public.loyalty_coins
    SET available_coins = available_coins + (
        SELECT COALESCE(signup_bonus_coins, 0)
        FROM public.loyalty_settings
        WHERE is_enabled = true
        LIMIT 1
    ),
    total_earned = total_earned + (
        SELECT COALESCE(signup_bonus_coins, 0)
        FROM public.loyalty_settings
        WHERE is_enabled = true
        LIMIT 1
    )
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function: Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_order_number TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.orders WHERE order_number = new_order_number
        );
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique order number';
        END IF;
    END LOOP;
    
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;


-- Function: Auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();


-- Function: Update order status history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.order_status_history (order_id, status, changed_by)
        VALUES (NEW.id, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_status
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();


-- Function: Update product stock on order
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease stock for product
    IF NEW.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id AND track_inventory = true;
    END IF;
    
    -- Decrease stock for variant
    IF NEW.variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.variant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_order
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_order();


-- Function: Calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal from order items
    NEW.subtotal := (
        SELECT COALESCE(SUM(total_price), 0)
        FROM public.order_items
        WHERE order_id = NEW.id
    );
    
    -- Calculate total
    NEW.total_amount := NEW.subtotal 
        + COALESCE(NEW.shipping_cost, 0) 
        + COALESCE(NEW.tax_amount, 0) 
        - COALESCE(NEW.discount_amount, 0)
        - COALESCE(NEW.coupon_discount, 0)
        - COALESCE(NEW.wallet_amount_used, 0)
        - COALESCE(NEW.loyalty_coins_value, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: Process loyalty coins on order completion
CREATE OR REPLACE FUNCTION process_loyalty_coins_on_order()
RETURNS TRIGGER AS $$
DECLARE
    coins_to_earn INTEGER;
    coins_per_rupee DECIMAL(5,2);
BEGIN
    -- Only process when order status changes to 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        
        -- Get coins per rupee from settings
        SELECT loyalty_settings.coins_per_rupee INTO coins_per_rupee
        FROM public.loyalty_settings
        WHERE is_enabled = true
        LIMIT 1;
        
        -- Calculate coins to earn
        coins_to_earn := FLOOR(NEW.total_amount * COALESCE(coins_per_rupee, 1));
        
        -- Add bonus coins from coupon if any
        coins_to_earn := coins_to_earn + COALESCE(NEW.loyalty_coins_earned, 0);
        
        IF coins_to_earn > 0 THEN
            -- Add loyalty transaction
            INSERT INTO public.loyalty_transactions (
                user_id,
                transaction_type,
                coins,
                balance_after,
                source,
                reference_id,
                order_id,
                description,
                expires_at
            )
            VALUES (
                NEW.user_id,
                'earned',
                coins_to_earn,
                (SELECT available_coins FROM public.loyalty_coins WHERE user_id = NEW.user_id) + coins_to_earn,
                'order',
                NEW.id,
                NEW.id,
                'Coins earned from order ' || NEW.order_number,
                NOW() + INTERVAL '365 days'
            );
            
            -- Update loyalty coins balance
            UPDATE public.loyalty_coins
            SET 
                available_coins = available_coins + coins_to_earn,
                total_earned = total_earned + coins_to_earn
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_loyalty_on_delivery
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION process_loyalty_coins_on_order();


-- ============================================================================
-- SECTION 13: INITIAL DATA SETUP
-- ============================================================================

-- Insert default website settings
INSERT INTO public.website_settings (
    site_name,
    site_tagline,
    contact_email,
    enable_cod,
    enable_online_payment,
    enable_wallet,
    enable_loyalty_coins
) VALUES (
    'Fashion Store',
    'Your Style, Our Passion',
    'support@fashionstore.com',
    true,
    true,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (
    is_enabled,
    coins_per_rupee,
    rupees_per_coin,
    min_coins_to_redeem,
    signup_bonus_coins,
    review_bonus_coins,
    referral_bonus_coins
) VALUES (
    true,
    1.00,
    1.00,
    10,
    50,
    10,
    100
) ON CONFLICT DO NOTHING;

-- Insert default shipping zone (All India)
INSERT INTO public.shipping_zones (zone_name, states) VALUES (
    'All India',
    ARRAY['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
          'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
          'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
          'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
          'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
          'Delhi', 'Jammu and Kashmir', 'Ladakh']
) ON CONFLICT DO NOTHING;

-- Insert default shipping rates
INSERT INTO public.shipping_rates (zone_id, min_order_value, max_order_value, shipping_cost, estimated_days)
SELECT 
    id,
    0,
    499,
    50,
    7
FROM public.shipping_zones
WHERE zone_name = 'All India'
ON CONFLICT DO NOTHING;

INSERT INTO public.shipping_rates (zone_id, min_order_value, max_order_value, shipping_cost, estimated_days)
SELECT 
    id,
    500,
    NULL,
    0,
    5
FROM public.shipping_zones
WHERE zone_name = 'All India'
ON CONFLICT DO NOTHING;


-- ============================================================================
-- DATABASE STRUCTURE COMPLETE
-- ============================================================================
-- This database structure provides:
-- ✅ Complete user authentication & management
-- ✅ Dynamic product catalog with variants (size, color)
-- ✅ Shopping cart & wishlist
-- ✅ Complete order management flow
-- ✅ Payment processing & refunds
-- ✅ Shipping management with zones & rates
-- ✅ Marketing modules (Coupons, Affiliate, Referral, Instagram, Offers)
-- ✅ Wallet & Loyalty coins system
-- ✅ Website settings & configuration
-- ✅ Performance indexes
-- ✅ Row Level Security policies
-- ✅ Automated triggers & functions
-- ✅ Production-ready & scalable
-- ============================================================================
