-- ============================================================================
-- 🎯 ULTIMATE COMPLETE DATABASE SCHEMA - WOMEN'S FASHION E-COMMERCE
-- ============================================================================
-- Business: Women's Kurtis & Dresses Online Store
-- Database: PostgreSQL (Supabase)
-- Generated: February 12, 2026
-- Purpose: Complete production-ready database schema
-- ============================================================================
-- 
-- 📋 WHAT THIS FILE INCLUDES:
-- ✅ User Management & Authentication
-- ✅ Product Catalog (Products, Categories, Variants, Images, Reviews)
-- ✅ Shopping Cart & Wishlist
-- ✅ Order Management System
-- ✅ Payment Processing & Refunds
-- ✅ Shipping Management
-- ✅ Coupon System
-- ✅ Offer System (Flash Sales, Discounts)
-- ✅ Affiliate Marketing System
-- ✅ Instagram Marketing System
-- ✅ Wallet System
-- ✅ Loyalty Coins System
-- ✅ Website Settings & Dynamic Content
-- ✅ Homepage Sliders & Banners
-- ✅ Feature Toggles
-- ✅ Notifications
-- ✅ Email & SMS Templates
-- ✅ Returns Management
-- ✅ All Indexes for Performance
-- ✅ All RLS Policies for Security
-- ✅ All Triggers & Functions
-- ✅ Storage Policies
-- ============================================================================
--
-- 🚀 INSTALLATION INSTRUCTIONS:
-- 1. Copy this ENTIRE file (Ctrl+A, Ctrl+C)
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste (Ctrl+V)
-- 4. Click RUN (or Ctrl+Enter)
-- 5. Wait 2-3 minutes for completion
-- 6. Verify: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
--    Expected: 60+ tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE REQUIRED EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- SECTION 2: USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- 2.1 USER PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('female', 'male', 'other')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2.2 ADMIN USERS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    admin_level VARCHAR(20) DEFAULT 'admin' CHECK (admin_level IN ('super_admin', 'admin', 'moderator')),
    permissions JSONB DEFAULT '{"products": true, "orders": true, "users": true, "settings": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2.3 USER ADDRESSES (Multiple shipping addresses)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

