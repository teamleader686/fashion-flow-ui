# 🧪 COMPREHENSIVE TESTING REPORT — StyleBazaar E-Commerce App
## Date: 20 February 2026 | Tester: Senior QA Engineer (AI)
## Stack: React + Vite + TypeScript + Supabase + TailwindCSS

---

# 📊 EXECUTIVE SUMMARY

| Metric                    | Value                               |
| :------------------------ | :---------------------------------- |
| **Total Bugs Found**      | **28**                              |
| **🔴 Critical**          | **5**                               |
| **🟠 High**              | **9**                               |
| **🟡 Medium**            | **8**                               |
| **🟢 Low**               | **6**                               |
| **Modules Tested**        | 15                                  |
| **Modules Passed**        | 5                                   |
| **Modules Partially Pass**| 7                                   |
| **Modules Failed**        | 3                                   |
| **Security Status**       | ✅ Protected routes working          |
| **Production Ready?**     | ❌ **NOT YET** — Critical fixes needed |

---

# 🐞 DETAILED BUG REPORT

---

## 🔴 CRITICAL BUGS (P0 — Must Fix Before Launch)

---

### Bug #1: Product Images Not Loading
- **Module:** Product Listing, Product Detail, Home Page
- **Title:** Most product images show grey placeholder instead of actual images
- **Steps:** Navigate to Home → View any product section
- **Expected:** Product images should load from Supabase storage
- **Actual:** Grey placeholder boxes with broken image icons are shown
- **Root Cause:** Images either not uploaded to Supabase storage bucket, or `product_images` table has incorrect/missing `image_url` values. The `CloudImage` component is not handling failed loads gracefully.
- **Impact:** Users cannot see what they are buying — **conversion killer**
- **Severity:** 🔴 **CRITICAL**
- **Fix:** 
  1. Verify Supabase storage bucket exists and is publicly accessible
  2. Re-upload product images with correct paths
  3. Add proper fallback/error handling in `CloudImage` component

---

### Bug #2: Hero Slider Shows Irrelevant Content
- **Module:** Home Page — `HeroCarousel` component
- **Title:** Hero banner displays "this is a slider" text and headphone images instead of fashion banners
- **Steps:** Navigate to Home page (http://localhost:8080/)
- **Expected:** Fashion-themed promotional banners matching StyleBazaar brand
- **Actual:** Placeholder text "this is a slider" with purple headphone image and number "40"
- **Root Cause:** The `sliders` table in Supabase contains test/placeholder data instead of production banners
- **Impact:** Destroys brand credibility on first visit
- **Severity:** 🔴 **CRITICAL**
- **Fix:** Replace slider data in database with actual fashion banner images and marketing content

---

### Bug #3: Category Circle Images Missing
- **Module:** Home Page — `CategoryCircles` component
- **Title:** Category circles show empty/grey circles without category images
- **Steps:** View category circles section on home page
- **Expected:** Circular images for each category (Kurtis, Dresses, Sarees, Sets, Tops, etc.)
- **Actual:** Grey circles with tiny dots — no visual indication of what each category represents
- **Root Cause:** `categories.image_url` field is either null or pointing to non-existent images
- **Impact:** Users cannot identify categories visually
- **Severity:** 🔴 **CRITICAL**
- **Fix:** Upload category images to Supabase storage and update `image_url` in `categories` table

---

### Bug #4: Garbage/Test Data in Production UI
- **Module:** Product Listing, Home Page
- **Title:** Products with names like "dadqw", "emo", "Hdhdjdj", "tr_shiv", "demo" visible
- **Steps:** Browse home page or products listing
- **Expected:** Professional product names (e.g., "Embroidered Silk Saree")
- **Actual:** Test/placeholder names visible alongside legitimate products
- **Root Cause:** Test data not cleaned from `products` table
- **Impact:** Completely unprofessional appearance
- **Severity:** 🔴 **CRITICAL**
- **Fix:** Delete test products from database or mark them as `is_active = false`

---

### Bug #5: product "tr_shiv" Shows Sofa Image on Fashion Site
- **Module:** Products Listing
- **Title:** A product displays a sofa/furniture image on a fashion e-commerce site
- **Steps:** Go to Products page → scroll to "tr_shiv"
- **Expected:** Fashion product image
- **Actual:** Image of a gray sofa with text "SOFA FOR YOUR HOME"
- **Root Cause:** Wrong image URL associated with this product in database
- **Impact:** Confusing and unprofessional — suggests data entry errors
- **Severity:** 🔴 **CRITICAL**
- **Fix:** Remove or fix this product entry in the database

---

## 🟠 HIGH SEVERITY BUGS (P1 — Fix Before Go-Live)

---

### Bug #6: Loyalty Coins Display Shows "0" on Product Detail Page
- **Module:** Product Detail Page
- **File:** `src/pages/ProductDetail.tsx` (line ~526)
- **Title:** Loyalty coins shows literal "0" instead of formatted message or being hidden
- **Steps:** Click on any product → View detail page → Look below "inclusive of all taxes"
- **Expected:** If `loyaltyCoins` is 0, the loyalty section should be hidden. If > 0, show "Earn X coins"
- **Actual:** Shows a bare "0" text on the page, which is a display bug
- **Root Cause:** The `{product.loyaltyCoins}` value renders "0" before the conditional check on line 571
- **Severity:** 🟠 **HIGH**
- **Fix:** Wrap the display in a condition: only show when `product.loyaltyCoins > 0`

---

### Bug #7: Rating Hardcoded to 4.5 for All Products
- **Module:** Product Detail, Product Listing
- **File:** `src/hooks/useProducts.ts` (line 93), `src/pages/ProductDetail.tsx` (line 162)
- **Title:** All products show "⭐ 4.5" rating regardless of actual reviews
- **Steps:** View any product card or product detail page
- **Expected:** Dynamic rating calculated from actual `product_reviews` data
- **Actual:** Static `rating: 4.5` and `reviewCount: 0` is hardcoded in `transformProduct()`
- **Root Cause:** Intentional placeholder, but misleading for users
- **Severity:** 🟠 **HIGH**
- **Fix:** Calculate average rating from `product_reviews` table either via RPC or aggregate query

---

### Bug #8: Google OAuth redirectTo URL Misconfigured
- **Module:** Authentication
- **File:** `src/contexts/AuthContext.tsx` (line 168-169)
- **Title:** OAuth redirect URL missing protocol and doesn't match local dev environment
- **Steps:** Attempt Google login
- **Expected:** `redirectTo` should be `https://stylebazaarkurti.netlify.app` or `http://localhost:8080` for dev
- **Actual:** `redirectTo: 'stylebazaarkurti.netlify.app'` — missing `https://` protocol
- **Root Cause:** Missing protocol prefix and no environment-based redirect URL
- **Severity:** 🟠 **HIGH**
- **Fix:** Use `redirectTo: \`${window.location.origin}/auth/callback\`` for dynamic URL resolution

---

### Bug #9: Cart Not Persisted Across Page Refreshes
- **Module:** Cart
- **File:** `src/contexts/CartContext.tsx`
- **Title:** Cart items are lost when the page is refreshed
- **Steps:** Add item to cart → Refresh the page
- **Expected:** Cart items persist (via localStorage or session)
- **Actual:** Cart state is React useState only — resets on refresh
- **Root Cause:** No localStorage/sessionStorage persistence for cart items
- **Severity:** 🟠 **HIGH**
- **Fix:** Add localStorage sync to CartContext (save on change, restore on mount)

---

### Bug #10: Checkout customer_email Uses addressLine2
- **Module:** Checkout
- **File:** `src/pages/Checkout.tsx` (line 280)
- **Title:** `customer_email` field is populated with address line 2 instead of actual email
- **Steps:** Place an order
- **Expected:** `customer_email` should be the user's actual email
- **Actual:** Code comment says `// Using addressLine2 as email placeholder` — incorrect mapping
- **Root Cause:** Intentional workaround that was never fixed
- **Severity:** 🟠 **HIGH**
- **Fix:** Use `profile?.email` or `user?.email` from auth context instead of `address.addressLine2`

---

### Bug #11: Checkout Shipping Calculation Inconsistency
- **Module:** Checkout
- **File:** `src/pages/Checkout.tsx` (line 121), `src/contexts/CartContext.tsx` (line 127-130)
- **Title:** Shipping is charged per cart item instead of per unique product / flat rate
- **Steps:** Add same product with different sizes → Check shipping total
- **Expected:** Shipping should be charged once per product or flat rate
- **Actual:** `totalShippingCost` sums shipping for every cart item entry (including variants)
- **Root Cause:** `items.reduce((sum, i) => sum + (i.product.shippingCharge || 0), 0)` counts every item row
- **Severity:** 🟠 **HIGH**
- **Fix:** Calculate shipping per unique product_id, not per cart item entry

---

### Bug #12: "Brands related to your search" Ad Overlay
- **Module:** Products Listing
- **Title:** Google Ads "Brands related to your search" box overlays product images
- **Steps:** Navigate to Products page → scroll through listings
- **Expected:** Clean product grid
- **Actual:** An ad overlay appears over product images showing irrelevant brands
- **Root Cause:** External Google Ads script injected, possibly from browser extension or dev environment
- **Severity:** 🟠 **HIGH** (if present in production)
- **Fix:** Check for ad scripts in `index.html`; ensure no ad-serving code is present

---

### Bug #13: Only COD Payment Available
- **Module:** Checkout — Payment
- **File:** `src/pages/Checkout.tsx` (line 107)
- **Title:** Payment method is hardcoded as "cod" with no other options
- **Steps:** Go to checkout → Payment section
- **Expected:** Multiple payment options (UPI, Card, Wallet)
- **Actual:** Only Cash on Delivery with message "No other payment methods available"
- **Root Cause:** `paymentMethod` is typed as `"cod"` only; no other payment flow integrated
- **Severity:** 🟠 **HIGH** (for production readiness)
- **Fix:** Integrate Razorpay/Stripe for online payments

---

### Bug #14: Stock Validation Missing at Checkout
- **Module:** Checkout, Cart
- **Title:** No stock validation before placing order
- **Steps:** Add product to cart → Another user buys last item → Place order
- **Expected:** "Out of stock" error with real-time stock check
- **Actual:** Order proceeds even if stock is depleted
- **Root Cause:** No stock decrement or validation in `useOrderPlacement.ts`
- **Severity:** 🟠 **HIGH**
- **Fix:** Add stock check + decrement (ideally via Supabase RPC with row locking)

---

## 🟡 MEDIUM SEVERITY BUGS (P2)

---

### Bug #15: Products Page Shows "0 products found" Briefly Before Loading
- **Module:** Products Listing
- **File:** `src/pages/Products.tsx`
- **Title:** Flash of "0 products found" while shimmer is still active
- **Steps:** Navigate to Products page → Observe initial load
- **Expected:** Show shimmer skeleton ONLY, then product count after data loads
- **Actual:** "0 products found" text appears alongside shimmer, then updates
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Only show product count after `loading === false`

---

### Bug #16: Offer Price Calculation Logic May Double-Discount
- **Module:** Product Pricing
- **File:** `src/hooks/useProducts.ts` (lines 62-77)
- **Title:** When `compare_at_price` and active offer both exist, pricing logic is confusing
- **Steps:** Product with compare_at_price=500, price=300, offer=20% → Expected final price?
- **Expected:** Clear single discount application
- **Actual:** `originalPrice` gets set to `dbProduct.price` when offer is active, losing compare_at_price context. The `discount` takes the MAX of compare_at_price discount and offer discount, but price calculation only uses offer discount on base price.
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Clarify discount precedence: either compare_at_price OR offer, not mixed

---

### Bug #17: Best Price Shows Even When Meaningless
- **Module:** Product Detail
- **File:** `src/pages/ProductDetail.tsx` (line 507-511)
- **Title:** "✨ Best Price ₹X" shows as 90% of already-discounted price without context
- **Steps:** View product detail page
- **Expected:** Best price should be a meaningful benchmark (e.g., lowest historical price)
- **Actual:** `bestPrice: Math.round(finalPrice * 0.9)` — just 90% of current price, arbitrary
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Calculate best price from actual historical data, or remove if not meaningful

---

### Bug #18: Admin Login Has No "Forgot Password" Flow
- **Module:** Admin Login
- **File:** `src/pages/admin/AdminLogin.tsx`
- **Title:** No password recovery option for admin users
- **Steps:** Go to /admin/login → No "Forgot Password" link
- **Expected:** Password reset option available
- **Actual:** Only email + password fields with no recovery path
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Add Supabase `resetPasswordForEmail` flow for admins

---

### Bug #19: Review Update Uses `new Date()` Instead of ISO String
- **Module:** Product Reviews
- **File:** `src/pages/ProductDetail.tsx` (line 287)
- **Title:** `updated_at: new Date()` may cause type mismatch with Supabase timestamp
- **Steps:** Edit an existing review
- **Expected:** `updated_at` should be ISO string for consistent Supabase storage
- **Actual:** Passing `new Date()` object which Supabase may serialize differently
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Use `new Date().toISOString()` for consistency

---

### Bug #20: `window.innerWidth` Used for Responsive Logic (SSR Issue Risk)
- **Module:** Checkout
- **File:** `src/pages/Checkout.tsx` (line 370, 567, 693, 767)
- **Title:** `window.innerWidth >= 1024` used in render for responsive collapsing
- **Steps:** Resize browser window → Sections don't auto-expand/collapse
- **Expected:** Responsive behavior via CSS or React breakpoint hook
- **Actual:** `window.innerWidth` is evaluated once during render, not reactive to resize events
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Use the existing `use-mobile.tsx` hook or CSS media queries instead

---

### Bug #21: Footer Help Links Are Non-Functional
- **Module:** Home Page Footer
- **Title:** "Track Order", "Returns", "FAQ" links use `<span>` with `cursor-pointer` but no navigation
- **Steps:** Click "Track Order" in footer
- **Expected:** Navigation to a tracking page
- **Actual:** Nothing happens — just a styled span, not a link
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Convert to `<Link>` components pointing to actual pages or `/pages/faq` etc.

---

### Bug #22: Footer Social Links Non-Functional
- **Module:** Home Page Footer
- **Title:** Instagram, Facebook, WhatsApp links are just `<span>` elements
- **Steps:** Click "Instagram" in footer
- **Expected:** Opens Instagram profile in new tab
- **Actual:** Nothing — no `href` or click handler
- **Severity:** 🟡 **MEDIUM**
- **Fix:** Add actual social media URLs with `<a href="..." target="_blank">`

---

## 🟢 LOW SEVERITY BUGS (P3)

---

### Bug #23: Console Logs Left in Production Code
- **Module:** Multiple
- **Files:** `AuthContext.tsx`, `useOrderPlacement.ts`, `ProductDetail.tsx`
- **Title:** Multiple `console.log`/`console.error` statements in production code
- **Steps:** Open browser DevTools Console
- **Expected:** Minimal/no console output in production
- **Actual:** Auth events, order attribution, and error logs visible
- **Severity:** 🟢 **LOW**
- **Fix:** Remove or wrap in `process.env.NODE_ENV === 'development'` checks

---

### Bug #24: Missing Duplicate Category Entries
- **Module:** Products Listing
- **Title:** Categories like "Shiv Halpati" and "Xyz" appear in category filter chips
- **Steps:** Go to Products page → View category filters
- **Expected:** Only real fashion categories
- **Actual:** Test categories ("Shiv Halpati", "Xyz") visible in filter chips
- **Severity:** 🟢 **LOW**
- **Fix:** Clean up `categories` table — mark test entries as `is_active = false`

---

### Bug #25: Auth Fallback Timer at 8 Seconds May Be Too Long
- **Module:** Authentication
- **File:** `src/contexts/AuthContext.tsx` (line 55)
- **Title:** 8-second auth loading fallback feels too long on slow connections
- **Steps:** Open app on slow network
- **Expected:** Reasonable loading timeout (3-5 seconds)
- **Actual:** Loading state can persist for up to 8 seconds
- **Severity:** 🟢 **LOW**
- **Fix:** Reduce to 5 seconds and show a retry button after timeout

---

### Bug #26: Review Delete Uses `confirm()` Instead of Custom Modal
- **Module:** Product Reviews
- **File:** `src/pages/ProductDetail.tsx` (line 310)
- **Title:** Browser native `confirm()` dialog used instead of custom UI modal
- **Steps:** Delete a review
- **Expected:** Custom styled confirmation dialog matching app theme
- **Actual:** Default browser `confirm()` — looks out of place
- **Severity:** 🟢 **LOW**
- **Fix:** Use a custom `AlertDialog` component from the UI library

---

### Bug #27: Missing SEO Meta Tags on Most Pages
- **Module:** SEO
- **Title:** Only ProductDetail page has `<SEO>` component — other pages missing
- **Steps:** Check page source for any page other than product detail
- **Expected:** Title, description, OG tags on every page
- **Actual:** Missing on Home, Products, Cart, Checkout, etc.
- **Severity:** 🟢 **LOW**
- **Fix:** Add SEO component to all page layouts

---

### Bug #28: Old Commented-Out Code in AuthContext
- **Module:** Authentication
- **File:** `src/contexts/AuthContext.tsx` (line 167)
- **Title:** Commented-out local IP redirect URL left in code
- **Actual:** `// redirectTo: 'http://10.178.221.41:8080',`
- **Severity:** 🟢 **LOW** (security info leak — internal IP visible)
- **Fix:** Remove commented-out code containing internal IPs

---

# 🔐 SECURITY TEST RESULTS

| Test | Status | Details |
| :--- | :--- | :--- |
| Admin routes redirect when unauthenticated | ✅ PASS | `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/settings` all redirect to `/admin/login` |
| User protected routes redirect | ✅ PASS | `/cart`, `/checkout`, `/wishlist`, `/my-orders`, `/wallet` redirect to `/login` |
| API keys exposed in client | ⚠️ WARN | Supabase anon key visible in `.env.local` — normal for anon key but ensure RLS is tight |
| No data leakage on redirect | ✅ PASS | Protected content never flashes before redirect |
| Internal IP in comments | ⚠️ WARN | Line 167 in AuthContext has `10.178.221.41` — should be removed |
| RPC functions accessible | ❓ NEEDS REVIEW | `apply_coupon_v2`, `deduct_loyalty_balance` — verify these have proper authorization |

---

# ⚡ PERFORMANCE TEST RESULTS

| Metric | Result | Assessment |
| :--- | :--- | :--- |
| Initial page load | Fast (~1-2s) | ✅ Good |
| Product listing load | Moderate (~2-3s) | ⚠️ OK |
| Product detail load | Fast (~1-2s) | ✅ Good |
| Lazy loading | Working | ✅ Suspense + lazy() working |
| Shimmer loading states | Working but flickers | ⚠️ "0 products found" flash |
| React Query cache | 2 min stale time | ✅ Good configuration |
| Real-time subscriptions | Active for products + categories | ⚠️ May cause unnecessary re-renders |
| Image optimization | ❌ Missing | No lazy loading, no WebP conversion |

---

# 📱 RESPONSIVE TEST RESULTS

| Test | Status | Details |
| :--- | :--- | :--- |
| Mobile layout | ⚠️ Partial | Category chips overflow horizontally (no scroll indicator) |
| Desktop layout | ✅ Good | Clean 4-column grid, proper spacing |
| Checkout mobile | ⚠️ Issues | `window.innerWidth` check doesn't respond to resize |
| Product detail mobile | ✅ Good | Swipeable carousel with dots works |
| Admin pages responsive | ❓ NEEDS TESTING | Could not access (requires login) |

---

# ✅ WHAT'S WORKING WELL

1. **Route Protection** — Both admin and user protected routes work perfectly
2. **Code Architecture** — Clean separation of concerns (hooks, contexts, pages, components)
3. **Product Variants** — Size and color selection working correctly
4. **Add to Cart** — Successfully adds items with toast confirmation
5. **Cart Counter** — Header cart badge updates in real-time
6. **Lazy Loading** — Code splitting with React.lazy() working
7. **Order Flow Architecture** — Well-structured with affiliate tracking, loyalty coins, coupons
8. **Error Boundaries** — ErrorBoundary wrapper prevents app crashes
9. **Checkout Flow** — Address validation with proper Indian phone/PIN format
10. **Admin Login UI** — Clean, professional design

---

# 🎯 PRIORITY FIX ORDER

### Phase 1: Data Cleanup (Day 1) — **Prerequisite for all testing**
1. ❌ Clean up test products (dadqw, emo, Hdhdjdj, tr_shiv, demo)
2. ❌ Upload real product images to Supabase storage
3. ❌ Upload category images
4. ❌ Replace slider test data with fashion banners
5. ❌ Remove test categories (Shiv Halpati, Xyz)

### Phase 2: Critical Code Fixes (Day 2-3)
6. 🔧 Fix OAuth redirect URL (add protocol, use dynamic URL)
7. 🔧 Fix customer_email mapping in Checkout
8. 🔧 Add cart persistence (localStorage)
9. 🔧 Fix loyalty coins "0" display bug
10. 🔧 Fix shipping calculation (per unique product)

### Phase 3: Important Improvements (Day 4-5)
11. 🔧 Add stock validation at checkout
12. 🔧 Make footer links functional
13. 🔧 Fix "0 products found" flash
14. 🔧 Replace hardcoded 4.5 rating with real data
15. 🔧 Fix window.innerWidth responsive logic

### Phase 4: Polish (Day 6-7)
16. 🔧 Remove console.logs from production
17. 🔧 Add SEO meta tags to all pages
18. 🔧 Replace confirm() with custom modal
19. 🔧 Remove commented-out internal IP
20. 🔧 Add online payment integration

---

# 💬 NEXT STEPS

Say **"fix all bugs from report"** to start fixing bugs automatically! 🔥

Or choose specific fixes:
- **"fix critical bugs"** — Fix only P0 data issues
- **"fix code bugs"** — Fix all code-level bugs (Phase 2-3)
- **"fix security issues"** — Fix security concerns only
- **"add payment integration"** — Add Razorpay/UPI support

---

*Report generated: 20 February 2026 | StyleBazaar v1.0 QA Testing*
