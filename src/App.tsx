import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import AffiliateTracker from "@/components/marketing/AffiliateTracker";
import { lazy, Suspense } from "react";
import { PageLoadingFallback } from "@/components/layout/LazyLoadingFallback";

// Lazy Loaded Pages - Main
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const Profile = lazy(() => import("./pages/Profile"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Offers = lazy(() => import("./pages/Offers"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const UserOrderDashboard = lazy(() => import("./pages/UserOrderDashboard"));
const Wallet = lazy(() => import("./pages/Wallet"));
const EditProfile = lazy(() => import("./pages/EditProfile"));

// Lazy Loaded Pages - Admin
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const StoreManagement = lazy(() => import("./pages/admin/StoreManagement"));
const StorageMonitoring = lazy(() => import("./pages/admin/StorageMonitoring"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const InstagramMarketing = lazy(() => import("./pages/admin/InstagramMarketing"));
const InstagramLogin = lazy(() => import("./pages/InstagramLogin"));
const InstagramDashboard = lazy(() => import("./pages/InstagramDashboard"));
const AffiliateMarketing = lazy(() => import("./pages/admin/AffiliateMarketing"));
const AffiliateLogin = lazy(() => import("./pages/AffiliateLogin"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const CouponManagement = lazy(() => import("./pages/admin/CouponManagement"));
const OfferManagement = lazy(() => import("./pages/admin/OfferManagement"));
const WalletManagement = lazy(() => import("./pages/admin/WalletManagement"));
const AffiliateCoupons = lazy(() => import("./pages/admin/AffiliateCoupons"));
const CancellationRequests = lazy(() => import("./pages/admin/CancellationRequests"));
const CategoryManagement = lazy(() => import("./pages/admin/CategoryManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import UserProtectedRoute from "@/components/auth/UserProtectedRoute";
import AffiliateProtectedRoute from "@/components/auth/AffiliateProtectedRoute";
import ProfileCompletionGuard from "@/components/ProfileCompletionGuard";

import ErrorBoundary from "@/components/layout/ErrorBoundary";

const queryClient = new QueryClient();

const AdminWishlist = lazy(() => import("./pages/admin/AdminWishlist"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <NavigationProvider>
              <ScrollToTop />
              <AffiliateTracker />
              <ErrorBoundary>
                <ProfileCompletionGuard>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/product/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<UserProtectedRoute><Cart /></UserProtectedRoute>} />
                      <Route path="/checkout" element={<UserProtectedRoute><Checkout /></UserProtectedRoute>} />
                      <Route path="/order-success" element={<UserProtectedRoute><OrderSuccess /></UserProtectedRoute>} />
                      <Route path="/wishlist" element={<UserProtectedRoute><Wishlist /></UserProtectedRoute>} />
                      <Route path="/account" element={<UserProtectedRoute><Account /></UserProtectedRoute>} />
                      <Route path="/profile" element={<UserProtectedRoute><Profile /></UserProtectedRoute>} />
                      <Route path="/edit-profile" element={<UserProtectedRoute><EditProfile /></UserProtectedRoute>} />
                      <Route path="/addresses" element={<UserProtectedRoute><Addresses /></UserProtectedRoute>} />
                      <Route path="/offers" element={<Offers />} />
                      <Route path="/notifications" element={<UserProtectedRoute><Notifications /></UserProtectedRoute>} />
                      <Route path="/my-orders" element={<UserProtectedRoute><MyOrders /></UserProtectedRoute>} />
                      <Route path="/order-dashboard" element={<UserProtectedRoute><UserOrderDashboard /></UserProtectedRoute>} />
                      <Route path="/wallet" element={<UserProtectedRoute><Wallet /></UserProtectedRoute>} />

                      {/* Admin Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                      <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                      <Route path="/admin/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                      <Route path="/admin/products/edit/:id" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                      <Route path="/admin/categories" element={<ProtectedRoute><CategoryManagement /></ProtectedRoute>} />
                      <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                      <Route path="/admin/cancellation-requests" element={<ProtectedRoute><CancellationRequests /></ProtectedRoute>} />
                      <Route path="/admin/shipping" element={<ProtectedRoute><AdminShipping /></ProtectedRoute>} />
                      <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
                      <Route path="/admin/instagram-marketing" element={<ProtectedRoute><InstagramMarketing /></ProtectedRoute>} />
                      <Route path="/admin/affiliate-marketing" element={<ProtectedRoute><AffiliateMarketing /></ProtectedRoute>} />
                      <Route path="/admin/affiliate-coupons" element={<ProtectedRoute><AffiliateCoupons /></ProtectedRoute>} />
                      <Route path="/admin/coupons" element={<ProtectedRoute><CouponManagement /></ProtectedRoute>} />
                      <Route path="/admin/offers" element={<ProtectedRoute><OfferManagement /></ProtectedRoute>} />
                      <Route path="/admin/wallet" element={<ProtectedRoute><WalletManagement /></ProtectedRoute>} />
                      <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
                      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                      <Route path="/admin/store" element={<ProtectedRoute><StoreManagement /></ProtectedRoute>} />
                      <Route path="/admin/store/storage" element={<ProtectedRoute><StorageMonitoring /></ProtectedRoute>} />
                      <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
                      <Route path="/admin/wishlist" element={<ProtectedRoute><AdminWishlist /></ProtectedRoute>} />

                      {/* Instagram User Routes */}
                      <Route path="/instagram-login" element={<InstagramLogin />} />
                      <Route path="/instagram-dashboard" element={<InstagramDashboard />} />


                      {/* Affiliate User Routes */}
                      <Route path="/affiliate-dashboard/login" element={<AffiliateLogin />} />
                      <Route path="/affiliate-dashboard" element={<AffiliateProtectedRoute><AffiliateDashboard /></AffiliateProtectedRoute>} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ProfileCompletionGuard>
              </ErrorBoundary>
            </NavigationProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
