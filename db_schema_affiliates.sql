-- ============================================================
-- AFFILIATE MARKETING SYSTEM - Database Schema
-- Run this SQL in your Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- 0. Ensure 'products' table has affiliate_enabled column
alter table public.products 
add column if not exists affiliate_enabled boolean default true;

-- 0b. Ensure 'orders' table has affiliate columns
alter table public.orders 
add column if not exists affiliate_id uuid references public.affiliates(id) on delete set null,
add column if not exists affiliate_commission_amount numeric default 0,
add column if not exists affiliate_commission_status text default 'pending';


-- 1. Affiliate Coupons Table (New Requirement)
-- Links a specific coupon code to an affiliate
create table if not exists public.affiliate_coupons (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete cascade,
  coupon_code text unique not null,
  discount_type text default 'percentage', -- 'percentage' or 'flat'
  discount_value numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
alter table public.affiliate_coupons enable row level security;
drop policy if exists "Enable read for all" on public.affiliate_coupons;
create policy "Enable read for all" on public.affiliate_coupons for select using (true);
drop policy if exists "Enable insert for admin/affiliate" on public.affiliate_coupons;
create policy "Enable insert for admin/affiliate" on public.affiliate_coupons for insert with check (true);


-- 2. Affiliate Clicks Table
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  landing_page text,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamp with time zone default now()
);
create index if not exists idx_affiliate_clicks_affiliate_id on public.affiliate_clicks(affiliate_id);
alter table public.affiliate_clicks enable row level security;
drop policy if exists "Enable insert for all" on public.affiliate_clicks;
create policy "Enable insert for all" on public.affiliate_clicks for insert with check (true);
drop policy if exists "Enable read for all" on public.affiliate_clicks;
create policy "Enable read for all" on public.affiliate_clicks for select using (true);


-- 3. Affiliate Commissions Table
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  commission_type text,
  commission_value numeric,
  order_amount numeric,
  commission_amount numeric,
  status text default 'pending',
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
create index if not exists idx_affiliate_commissions_affiliate_id on public.affiliate_commissions(affiliate_id);
alter table public.affiliate_commissions enable row level security;
drop policy if exists "Enable read for all" on public.affiliate_commissions;
create policy "Enable read for all" on public.affiliate_commissions for select using (true);
drop policy if exists "Enable insert for all" on public.affiliate_commissions;
create policy "Enable insert for all" on public.affiliate_commissions for insert with check (true);


-- 4. Affiliate Orders Table
create table if not exists public.affiliate_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  affiliate_id uuid references public.affiliates(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_amount numeric,
  commission_amount numeric,
  commission_type text,
  commission_rate numeric,
  status text default 'pending',
  created_at timestamp with time zone default now()
);
create index if not exists idx_affiliate_orders_affiliate_id on public.affiliate_orders(affiliate_id);
alter table public.affiliate_orders enable row level security;
drop policy if exists "Enable read for all" on public.affiliate_orders;
create policy "Enable read for all" on public.affiliate_orders for select using (true);
drop policy if exists "Enable insert for all" on public.affiliate_orders;
create policy "Enable insert for all" on public.affiliate_orders for insert with check (true);


-- 5. Affiliate Withdrawals Table
create table if not exists public.affiliate_withdrawals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  amount numeric not null,
  payment_method text default 'upi',
  payment_details jsonb,
  status text default 'pending',
  admin_notes text,
  processed_at timestamp with time zone,
  processed_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);
alter table public.affiliate_withdrawals enable row level security;
drop policy if exists "Enable read for all" on public.affiliate_withdrawals;
create policy "Enable read for all" on public.affiliate_withdrawals for select using (true);
drop policy if exists "Enable insert for all" on public.affiliate_withdrawals;
create policy "Enable insert for all" on public.affiliate_withdrawals for insert with check (true);


-- 6. Wallet Transactions Table
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete cascade,
  transaction_type text not null,
  amount numeric not null,
  balance_before numeric default 0,
  balance_after numeric default 0,
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamp with time zone default now()
);
alter table public.wallet_transactions 
add column if not exists affiliate_id uuid references public.affiliates(id) on delete cascade;

alter table public.wallet_transactions enable row level security;
drop policy if exists "Enable read for all" on public.wallet_transactions;
create policy "Enable read for all" on public.wallet_transactions for select using (true);
drop policy if exists "Enable insert for all" on public.wallet_transactions;
create policy "Enable insert for all" on public.wallet_transactions for insert with check (true);


-- 7. (Optional/Deprecated) Assigned Products Table
-- We keep this table structure just in case manual overriding is needed,
-- but the main logic will now default to allowing ALL products.
create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.affiliates(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(affiliate_user_id, product_id)
);
alter table public.affiliate_products enable row level security;
drop policy if exists "Enable read for all" on public.affiliate_products;
create policy "Enable read for all" on public.affiliate_products for select using (true);
