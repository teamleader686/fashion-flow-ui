-- ============================================================================
-- 🎯 FINAL COMPLETE E-COMMERCE DATABASE SCHEMA
-- ============================================================================
-- Women's Fashion E-Commerce Platform - Complete Database
-- Run this ONE file in Supabase SQL Editor
-- Execution Time: ~3 minutes
-- ============================================================================
--
-- 📦 INCLUDES ALL SYSTEMS:
-- ✅ Core E-Commerce (Products, Orders, Cart, Checkout)
-- ✅ Coupon System (from coupon_system_complete_schema.sql)
-- ✅ Offer System (from offer_system_complete_schema.sql)
-- ✅ Affiliate Marketing (from affiliate_marketing_complete_schema.sql)
-- ✅ Instagram Marketing (from instagram_marketing_complete_schema.sql)
-- ✅ Wallet & Loyalty (from wallet_loyalty_system_schema.sql)
-- ✅ Website Settings (from website_settings_schema.sql)
-- ✅ Returns Management (from add_returns_table.sql)
-- ✅ Storage Policies (from FIX_STORAGE_RLS_POLICY.sql)
-- ✅ All RLS Policies, Triggers, Functions, Indexes
-- ============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

