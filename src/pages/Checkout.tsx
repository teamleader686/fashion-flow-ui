import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useOrderPlacement } from "@/hooks/useOrderPlacement";
import { useValidateCoupon } from "@/hooks/useCoupons";
import {
  ChevronLeft,
  MapPin,
  Tag,
  Coins,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Gift,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// Mock loyalty settings - can be moved to state if needed
const COINS_PER_RUPEE = 1; // 1 coin = ₹1
const MAX_COINS_PERCENT = 50; // max 50% of order

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

import { AddressSection } from "@/components/checkout/AddressSection";
import { UserAddress } from "@/hooks/useAddresses";
import CloudImage from "@/components/ui/CloudImage";

const Checkout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, totalPrice, totalItems, totalCoinsRequired, totalShippingCost, clearCart } = useCart();
  const { placeOrder, loading: placingOrder } = useOrderPlacement();

  // Fetched data
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Address - for guest or currently selected
  const [address, setAddress] = useState<AddressForm>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState<Partial<AddressForm>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // When a saved address is selected
  const handleAddressSelect = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setAddress({
      fullName: addr.full_name,
      phone: addr.phone,
      addressLine1: addr.address_line1,
      addressLine2: addr.address_line2 || addr.landmark || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.zip_code,
    });
    setAddressErrors({});
  };

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const { validateCoupon, validating: validatingCoupon } = useValidateCoupon();

  // Loyalty coins
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"cod">("cod");

  // Order sections expand (mobile)
  const [expandedSection, setExpandedSection] = useState<string>("address");

  // Calculations
  const subtotalWithOffers = totalPrice;
  const subtotalWithoutOffers = items.reduce((sum, i) => sum + (i.isCoinItem ? 0 : i.product.price * i.quantity), 0);

  const subtotal = appliedCoupon ? subtotalWithoutOffers : subtotalWithOffers;
  const shipping = subtotal >= 999 ? 0 : totalShippingCost;

  const couponDiscount = useMemo(() => {
    return appliedCoupon?.discount || 0;
  }, [appliedCoupon]);

  // Max coins available for partial discount (after deducting fixed coin costs)
  const availableForDiscount = Math.max(0, loyaltyBalance - totalCoinsRequired);

  const maxCoinsUsable = Math.min(
    availableForDiscount,
    Math.floor((subtotal - couponDiscount) * MAX_COINS_PERCENT / 100)
  );

  const coinsValue = useCoins ? Math.min(coinsToUse, maxCoinsUsable) * COINS_PER_RUPEE : 0;

  // Fetch coupons
  useEffect(() => {
    // Fallback security: never stay in loading state forever
    const timer = setTimeout(() => {
      setLoadingData(false);
    }, 5000);

    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch user's loyalty balance
        if (user) {
          const { data: wallet, error: walletError } = await supabase
            .from('loyalty_wallet')
            .select('available_balance')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!walletError && wallet) {
            setLoyaltyBalance(wallet.available_balance);
          }
        }

        // Fetch active coupons
        const { data: coupons, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .gte('expiry_date', new Date().toISOString());

        if (!couponError) {
          setAvailableCoupons(coupons || []);
        } else {
          console.error('Error fetching coupons:', couponError);
        }
      } catch (err) {
        console.error("Error fetching checkout data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const finalTotal = Math.max(0, subtotal + shipping - couponDiscount - coinsValue);

  // Validate address
  const validateAddress = (): boolean => {
    const errors: Partial<AddressForm> = {};
    if (!address.fullName.trim()) errors.fullName = "Name is required";
    else if (address.fullName.trim().length > 100) errors.fullName = "Name too long";

    if (!address.phone.trim()) errors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone.trim())) errors.phone = "Enter valid 10-digit phone";

    if (!address.addressLine1.trim()) errors.addressLine1 = "Address is required";
    else if (address.addressLine1.trim().length > 200) errors.addressLine1 = "Address too long";

    if (!address.city.trim()) errors.city = "City is required";
    if (!address.state) errors.state = "State is required";

    if (!address.pincode.trim()) errors.pincode = "PIN code is required";
    else if (!/^\d{6}$/.test(address.pincode.trim())) errors.pincode = "Enter valid 6-digit PIN";

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Redirect if cart empty (moved after hooks)
  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-xl font-bold mb-2">No items to checkout</h1>
          <Link to="/cart" className="text-primary hover:underline text-sm">Go to cart</Link>
        </div>
      </Layout>
    );
  }


  // Apply coupon
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (appliedCoupon && appliedCoupon.code === code) {
      toast.error("Coupon already applied");
      return;
    }

    try {
      const result = await validateCoupon(
        code,
        user?.id || "",
        subtotalWithoutOffers, // Use base price for coupon validation
        items.map(i => i.product.id),
        [] // No other coupons since we only allow one
      );

      if (result.valid) {
        setAppliedCoupon(result);
        setCouponCode("");
        setShowCoupons(false);
        toast.success(`Coupon ${code} applied!`);
      } else {
        toast.error(result.error || "Invalid coupon code");
      }
    } catch (err) {
      toast.error("Failed to apply coupon");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      setExpandedSection("address");
      toast.error("Please fill in your delivery address");
      return;
    }

    if (totalCoinsRequired > loyaltyBalance) {
      toast.error(`Insufficient coin balance. Required: ${totalCoinsRequired}, Available: ${loyaltyBalance}`);
      return;
    }

    const totalCoinsToEarn = items.reduce((acc, item) => {
      if (item.isCoinItem) return acc;
      return acc + ((item.product.loyaltyCoins || 0) * item.quantity);
    }, 0);

    // Prepare order data
    const orderData = {
      customer_name: address.fullName,
      customer_email: address.addressLine2 || undefined, // Using addressLine2 as email placeholder
      customer_phone: address.phone,
      shipping_address_line1: address.addressLine1,
      shipping_address_line2: address.addressLine2 || undefined,
      shipping_city: address.city,
      shipping_state: address.state,
      shipping_zip: address.pincode,
      shipping_country: 'India',
      subtotal,
      shipping_cost: shipping,
      discount_amount: 0,
      coupon_discount: couponDiscount,
      wallet_amount_used: 0,
      loyalty_coins_used: (useCoins ? coinsToUse : 0) + totalCoinsRequired,
      loyalty_coins_value: coinsValue,
      total_coins_to_earn: totalCoinsToEarn,
      total_amount: finalTotal,
      shipping_charge: shipping,
      applied_coupons: appliedCoupon ? [{
        id: appliedCoupon.id,
        code: appliedCoupon.code,
        discount: appliedCoupon.discount,
        is_affiliate_coupon: appliedCoupon.is_affiliate_coupon,
        affiliate_user_id: appliedCoupon.affiliate_user_id,
        commission_amount: appliedCoupon.commission_amount
      }] : [],
      payment_method: 'cod' as const,
      items: items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image,
        sku: item.product.slug,
        size: item.selectedSize,
        color: item.selectedColor,
        quantity: item.quantity,
        unit_price: item.isCoinItem ? 0 : (appliedCoupon ? item.product.price : (item.offerPrice || item.product.price)),
        total_price: item.isCoinItem ? 0 : ((appliedCoupon ? item.product.price : (item.offerPrice || item.product.price)) * item.quantity),
        offer_id: appliedCoupon ? undefined : item.offer?.offer_id,
        metadata: item.isCoinItem ? { paid_with_coins: true, coins_price: item.coinPrice } : undefined,
      })),
    };

    const orderNumber = await placeOrder(orderData);

    if (orderNumber) {
      clearCart();
      navigate(`/order-success?order=${orderNumber}`);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  return (
    <Layout>
      <div className="container py-4 lg:py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/cart")} className="p-1.5 rounded-full hover:bg-secondary">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl lg:text-2xl font-bold">Checkout</h1>
          <span className="text-sm text-muted-foreground ml-auto">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Forms */}
          <div className="flex-1 space-y-4">
            {/* ──────── SHIPPING ADDRESS ──────── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSection("address")}
                className="w-full flex items-center justify-between p-4 lg:cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-sm">Delivery Address</h2>
                </div>
                <span className="lg:hidden">
                  {expandedSection === "address" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {(expandedSection === "address" || window.innerWidth >= 1024) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      {user ? (
                        <AddressSection
                          selectedAddressId={selectedAddressId}
                          onSelect={handleAddressSelect}
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Full Name */}
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
                            <input
                              type="text"
                              placeholder="Enter full name"
                              maxLength={100}
                              value={address.fullName}
                              onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.fullName ? "border-accent" : "border-border"}`}
                            />
                            {addressErrors.fullName && <p className="text-[11px] text-accent mt-0.5">{addressErrors.fullName}</p>}
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                              <input
                                type="tel"
                                placeholder="9876543210"
                                maxLength={10}
                                value={address.phone}
                                onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background pl-12 focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.phone ? "border-accent" : "border-border"}`}
                              />
                            </div>
                            {addressErrors.phone && <p className="text-[11px] text-accent mt-0.5">{addressErrors.phone}</p>}
                          </div>

                          {/* PIN Code */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">PIN Code *</label>
                            <input
                              type="text"
                              placeholder="400001"
                              maxLength={6}
                              value={address.pincode}
                              onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.pincode ? "border-accent" : "border-border"}`}
                            />
                            {addressErrors.pincode && <p className="text-[11px] text-accent mt-0.5">{addressErrors.pincode}</p>}
                          </div>

                          {/* Address Line 1 */}
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Address Line 1 *</label>
                            <input
                              type="text"
                              placeholder="House no., Building, Street"
                              maxLength={200}
                              value={address.addressLine1}
                              onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.addressLine1 ? "border-accent" : "border-border"}`}
                            />
                            {addressErrors.addressLine1 && <p className="text-[11px] text-accent mt-0.5">{addressErrors.addressLine1}</p>}
                          </div>

                          {/* Address Line 2 */}
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Address Line 2</label>
                            <input
                              type="text"
                              placeholder="Landmark, Area (optional)"
                              maxLength={200}
                              value={address.addressLine2}
                              onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>

                          {/* City */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">City *</label>
                            <input
                              type="text"
                              placeholder="City"
                              maxLength={100}
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.city ? "border-accent" : "border-border"}`}
                            />
                            {addressErrors.city && <p className="text-[11px] text-accent mt-0.5">{addressErrors.city}</p>}
                          </div>

                          {/* State */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">State *</label>
                            <select
                              value={address.state}
                              onChange={(e) => setAddress({ ...address, state: e.target.value })}
                              className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${addressErrors.state ? "border-accent" : "border-border"}`}
                            >
                              <option value="">Select state</option>
                              {indianStates.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            {addressErrors.state && <p className="text-[11px] text-accent mt-0.5">{addressErrors.state}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ──────── COUPON CODE ──────── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSection("coupon")}
                className="w-full flex items-center justify-between p-4 lg:cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-sm">Apply Coupon</h2>
                  {appliedCoupon && (
                    <span className="text-xs font-semibold text-discount bg-primary/10 px-2 py-0.5 rounded-full">
                      -{couponDiscount > 0 ? `₹${couponDiscount}` : ""}
                    </span>
                  )}
                </div>
                <span className="lg:hidden">
                  {expandedSection === "coupon" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {(expandedSection === "coupon" || window.innerWidth >= 1024) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      {appliedCoupon ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div>
                              <p className="text-sm font-bold text-primary">
                                {appliedCoupon.code}
                                {appliedCoupon.is_affiliate_coupon && (
                                  <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">AFFILIATE</span>
                                )}
                              </p>
                              <p className="text-xs font-semibold text-discount mt-0.5">You save ₹{appliedCoupon.discount}</p>
                            </div>
                            <button onClick={removeCoupon} className="p-1.5 hover:bg-secondary rounded-full">
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter coupon code"
                              maxLength={20}
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={validatingCoupon}
                              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {validatingCoupon ? "..." : "Apply"}
                            </button>
                          </div>

                          <button
                            onClick={() => setShowCoupons(!showCoupons)}
                            className="text-xs text-primary font-medium mt-2 hover:underline"
                          >
                            {showCoupons ? "Hide coupons" : "View available coupons"}
                          </button>

                          <AnimatePresence>
                            {showCoupons && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 space-y-2 overflow-hidden"
                              >
                                {availableCoupons.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">No coupons available right now</p>
                                ) : (
                                  availableCoupons.map((coupon) => (
                                    <div
                                      key={coupon.id}
                                      className="flex items-center justify-between p-3 border border-dashed border-border rounded-lg"
                                    >
                                      <div>
                                        <p className="text-sm font-bold">{coupon.coupon_code}</p>
                                        <p className="text-[11px] text-muted-foreground">{coupon.description || coupon.coupon_title}</p>
                                        <p className="text-[11px] text-muted-foreground">Min order: ₹{coupon.min_order_value}</p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setCouponCode(coupon.coupon_code);
                                          if (subtotal >= coupon.min_order_value) {
                                            handleApplyCoupon();
                                          } else {
                                            toast.error(`Minimum order of ₹${coupon.min_order_value} required`);
                                          }
                                        }}
                                        className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ──────── LOYALTY COINS ──────── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSection("coins")}
                className="w-full flex items-center justify-between p-4 lg:cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-star/20 flex items-center justify-center">
                    <Coins className="h-4 w-4 text-star" />
                  </div>
                  <div className="text-left">
                    <h2 className="font-semibold text-sm">Loyalty Coins</h2>
                    <p className="text-[11px] text-muted-foreground">Balance: {loyaltyBalance} coins</p>
                  </div>
                  {useCoins && coinsValue > 0 && (
                    <span className="text-xs font-semibold text-discount bg-primary/10 px-2 py-0.5 rounded-full">
                      -₹{coinsValue}
                    </span>
                  )}
                </div>
                <span className="lg:hidden">
                  {expandedSection === "coins" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {(expandedSection === "coins" || window.innerWidth >= 1024) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Use coins for this order</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useCoins}
                            onChange={(e) => {
                              setUseCoins(e.target.checked);
                              if (e.target.checked) setCoinsToUse(maxCoinsUsable);
                              else setCoinsToUse(0);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                        </label>
                      </div>

                      {useCoins && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={maxCoinsUsable}
                              step={10}
                              value={coinsToUse}
                              onChange={(e) => setCoinsToUse(Number(e.target.value))}
                              className="flex-1 accent-primary"
                            />
                            <span className="text-sm font-bold w-16 text-right">{coinsToUse} coins</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>0</span>
                            <span>Max: {maxCoinsUsable} coins (₹{maxCoinsUsable})</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            1 coin = ₹1 • Max {MAX_COINS_PERCENT}% of order value
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ──────── PAYMENT METHOD ──────── */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleSection("payment")}
                className="w-full flex items-center justify-between p-4 lg:cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-sm">Payment Method</h2>
                </div>
                <span className="lg:hidden">
                  {expandedSection === "payment" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {(expandedSection === "payment" || window.innerWidth >= 1024) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Cash on Delivery (COD)</p>
                          <p className="text-[11px] text-muted-foreground font-medium">Pay securely when you receive your order</p>
                        </div>
                        <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 text-center italic">
                        No other payment methods are available at this time.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ──────── RIGHT: ORDER SUMMARY ──────── */}
          <div className="lg:w-80">
            <div className="bg-card rounded-xl border border-border p-5 sticky top-20 space-y-4">
              <h3 className="font-semibold">Order Summary</h3>

              {/* Items preview */}
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${item.isCoinItem}`} className="flex gap-2 text-sm">
                    <CloudImage
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-12 rounded shrink-0"
                      imageClassName="w-full h-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{item.product.name}</p>
                      <p className="text-[11px] text-muted-foreground flex gap-2">
                        <span>Size: {item.selectedSize}</span>
                        {item.selectedColor && (
                          <>
                            <span>•</span>
                            <span>Color: {item.selectedColor}</span>
                          </>
                        )}
                        <span>× {item.quantity}</span>
                      </p>
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {item.isCoinItem ? (
                        <span className="text-purple-700 font-bold flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {(item.coinPrice || 0) * item.quantity}
                        </span>
                      ) : (
                        item.offer?.type === 'bogo' && !appliedCoupon ? (
                          <div className="text-right">
                            <div className="text-[10px] text-discount font-bold">BOGO Active</div>
                            <div className="line-through text-gray-400 text-[10px]">₹{(item.product.price * item.quantity).toLocaleString()}</div>
                            <div>₹{(item.product.price * (item.quantity - Math.floor(item.quantity / 2))).toLocaleString()}</div>
                          </div>
                        ) : (
                          `₹${((appliedCoupon ? item.product.price : (item.offerPrice || item.product.price)) * item.quantity).toLocaleString()}`
                        )
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {totalCoinsRequired > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span className="text-muted-foreground">Coins Redemption</span>
                    <span className="font-medium flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {totalCoinsRequired.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-discount font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {couponDiscount > 0 && appliedCoupon && (
                  <div className="flex flex-col gap-1 border-b border-border/50 pb-2">
                    <div className="flex justify-between text-discount text-xs">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>-₹{appliedCoupon.discount}</span>
                    </div>
                    <div className="flex justify-between text-discount font-bold mt-1">
                      <span>Total Savings</span>
                      <span>-₹{couponDiscount}</span>
                    </div>
                  </div>
                )}
                {coinsValue > 0 && (
                  <div className="flex justify-between text-discount">
                    <span>Loyalty Coins Discount ({coinsToUse})</span>
                    <span>-₹{coinsValue}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>

                {(couponDiscount + coinsValue) > 0 && (
                  <p className="text-xs font-semibold text-discount text-center">
                    🎉 You save ₹{(couponDiscount + coinsValue).toLocaleString()} on this order!
                  </p>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  paymentMethod === "cod" ? "Place Order (COD)" : `Pay ₹${finalTotal.toLocaleString()}`
                )}
              </button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Gift className="h-3.5 w-3.5" />
                  <span>Earn Coins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
