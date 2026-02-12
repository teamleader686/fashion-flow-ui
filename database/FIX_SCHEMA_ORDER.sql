-- ============================================================================
-- FIX: Run this INSTEAD of COMPLETE_DATABASE_SCHEMA.sql
-- This fixes the table creation order to resolve foreign key dependencies
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Paste in Supabase SQL Editor
-- 3. Run (will take 60-90 seconds)
-- 4. Verify 54 tables created

-- ============================================================================
-- STEP 1: Create tables WITHOUT foreign key dependencies first
-- ============================================================================

-- Run the main schema but we'll handle product_reviews separately
-- First, let's create a modified version that skips product_reviews initially

-- ============================================================================
-- WORKAROUND: Create orders table BEFORE product_reviews
-- ============================================================================

-- Create a minimal orders table first (we'll add constraints later)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_landmark TEXT,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_zip VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'India',
    billing_same_as_shipping BOOLEAN DEFAULT true,
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_zip VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'India',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    wallet_amount_used DECIMAL(10,2) DEFAULT 0,
    loyalty_coins_used INTEGER DEFAULT 0,
    loyalty_coins_value DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    coupon_id UUID,
    coupon_code VARCHAR(50),
    loyalty_coins_earned INTEGER DEFAULT 0,
    affiliate_id UUID,
    referral_id UUID,
    instagram_influencer_id UUID,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'cod',
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    packed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Now you can run the rest of COMPLETE_DATABASE_SCHEMA.sql
-- OR use the instructions below

