import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";
import Offers from "./pages/Offers";
import Notifications from "./pages/Notifications";
import MyOrders from "./pages/MyOrders";
import UserOrderDashboard from "./pages/UserOrderDashboard";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import StoreManagement from "./pages/admin/StoreManagement";
import StorageMonitoring from "./pages/admin/StorageMonitoring";
import ProductForm from "./pages/admin/ProductForm";
import InstagramMarketing from "./pages/admin/InstagramMarketing";
import InstagramLogin from "./pages/InstagramLogin";
import InstagramDashboard from "./pages/InstagramDashboard";
import AffiliateMarketing from "./pages/admin/AffiliateMarketing";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import CouponManagement from "./pages/admin/CouponManagement";
import OfferManagement from "./pages/admin/OfferManagement";
import WalletManagement from "./pages/admin/WalletManagement";
import AffiliateCoupons from "./pages/admin/AffiliateCoupons";
import CancellationRequests from "./pages/admin/CancellationRequests";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

const queryClient = new QueryClient();

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
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/account" element={<Account />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/order-dashboard" element={<UserOrderDashboard />} />
              
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
              
              {/* Instagram User Routes */}
              <Route path="/instagram-login" element={<InstagramLogin />} />
              <Route path="/instagram-dashboard" element={<InstagramDashboard />} />
              
              {/* Affiliate User Routes */}
              <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
            </NavigationProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
