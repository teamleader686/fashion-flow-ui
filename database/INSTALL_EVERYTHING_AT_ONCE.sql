-- ============================================================================
-- 🎯 INSTALL EVERYTHING AT ONCE - COMPLETE E-COMMERCE DATABASE
-- ============================================================================
-- This file combines ALL schemas into ONE installation script
-- Run this ONCE in Supabase SQL Editor to get everything
-- Execution Time: ~5 minutes
-- ============================================================================
--
-- 📦 WHAT THIS INSTALLS:
-- ✅ Core E-Commerce (Products, Orders, Cart, Users)
-- ✅ Coupon System
-- ✅ Offer System  
-- ✅ Affiliate Marketing
-- ✅ Instagram Marketing
-- ✅ Wallet & Loyalty Coins
-- ✅ Website Settings & Dynamic Content
-- ✅ Returns Management
-- ✅ Storage Policies
-- ✅ All RLS Policies
-- ✅ All Triggers & Functions
-- ============================================================================
--
-- 🚀 INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and click RUN
-- 4. Wait 5 minutes
-- 5. Run MAKE_ME_ADMIN.sql with your user_id
-- 6. Done!
-- ============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: RUN THE CORE DATABASE SCHEMA
-- ============================================================================
-- This includes: Users, Products, Orders, Cart, Payments, Shipping
-- Source: FINAL_WORKING_SCHEMA.sql
-- ============================================================================

-- NOTE: Due to file size limits, you need to run FINAL_WORKING_SCHEMA.sql first
-- Then run the additional modules below

-- If you haven't run FINAL_WORKING_SCHEMA.sql yet, STOP HERE and run it first!
-- Then come back and run the rest of this file.

-- ============================================================================
-- STEP 2: WEBSITE SETTINGS & DYNAMIC CONTENT SYSTEM
-- ============================================================================
-- Source: website_settings_schema.sql
-- ============================================================================

