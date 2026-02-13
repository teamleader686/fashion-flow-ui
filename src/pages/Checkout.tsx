import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useOrderPlacement } from "@/hooks/useOrderPlacement";
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

const Checkout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, totalPrice, totalItems, clearCart } = useCart();
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

  // Loyalty coins
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | "wallet">("online");

  // Order sections expand (mobile)
  const [expandedSection, setExpandedSection] = useState<string>("address");

  // Calculations
  const subtotal = totalPrice;
  const shipping = subtotal >= 999 ? 0 : 79;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    // Map DB column names (handling both potential schemas if mixed, but prioritizing actual likely schema)
    const minOrder = appliedCoupon.min_order_amount ?? appliedCoupon.min_order_value ?? 0;
    const type = appliedCoupon.type ?? appliedCoupon.discount_type;
    const value = appliedCoupon.value ?? appliedCoupon.discount_value ?? 0;
    const maxDiscount = appliedCoupon.max_discount ?? appliedCoupon.max_discount_amount;

    if (subtotal < minOrder) return 0;
    if (type === "percentage") {
      const discount = Math.floor(subtotal * value / 100);
      return maxDiscount
        ? Math.min(discount, maxDiscount)
        : discount;
    }
    return value;
  }, [appliedCoupon, subtotal]);

  const maxCoinsUsable = Math.min(
    loyaltyBalance,
    Math.floor((subtotal - couponDiscount) * MAX_COINS_PERCENT / 100)
  );

  const coinsValue = useCoins ? Math.min(coinsToUse, maxCoinsUsable) * COINS_PER_RUPEE : 0;

  // Fetch coupons
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Fetch user's loyalty balance
        if (user) {
          const { data: wallet, error: walletError } = await supabase
            .from('loyalty_coins')
            .select('available_coins')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!walletError && wallet) {
            setLoyaltyBalance(wallet.available_coins);
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
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }
    // Check both code and coupon_code field to be safe
    const found = availableCoupons.find((c) => (c.code === code || c.coupon_code === code));
    if (!found) {
      toast.error("Invalid coupon code");
      return;
    }
    const minOrder = found.min_order_amount ?? found.min_order_value ?? 0;
    if (subtotal < minOrder) {
      toast.error(`Minimum order of ₹${minOrder} required`);
      return;
    }
    setAppliedCoupon(found);
    setShowCoupons(false);
    toast.success(`Coupon ${code} applied!`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!validateAddress()) {
      setExpandedSection("address");
      toast.error("Please fill in your delivery address");
      return;
    }

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
      loyalty_coins_used: useCoins ? coinsToUse : 0,
      loyalty_coins_value: coinsValue,
      total_amount: finalTotal,
      coupon_code: appliedCoupon?.code || appliedCoupon?.coupon_code,
      payment_method: paymentMethod,
      items: items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image,
        sku: item.product.slug,
        size: item.selectedSize,
        color: item.selectedColor,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
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
                        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div>
                            <p className="text-sm font-bold text-primary">{appliedCoupon.coupon_code}</p>
                            <p className="text-xs text-muted-foreground">{appliedCoupon.description || appliedCoupon.coupon_title}</p>
                            <p className="text-xs font-semibold text-discount mt-0.5">You save ₹{couponDiscount}</p>
                          </div>
                          <button onClick={removeCoupon} className="p-1.5 hover:bg-secondary rounded-full">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
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
                              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                            >
                              Apply
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
                                            setAppliedCoupon(coupon);
                                            setShowCoupons(false);
                                            toast.success(`Coupon ${coupon.coupon_code} applied!`);
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
                    <div className="px-4 pb-4 space-y-2">
                      {/* Online Payment */}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="online"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                          className="accent-primary"
                        />
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Online Payment</p>
                          <p className="text-[11px] text-muted-foreground">UPI, Debit/Credit Card, Net Banking</p>
                        </div>
                        {paymentMethod === "online" && (
                          <span className="text-[10px] font-semibold text-discount bg-primary/10 px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </label>

                      {/* Wallet */}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "wallet" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="wallet"
                          checked={paymentMethod === "wallet"}
                          onChange={() => setPaymentMethod("wallet")}
                          className="accent-primary"
                        />
                        <Wallet className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">StyleBazaar Wallet</p>
                          <p className="text-[11px] text-muted-foreground">Balance: ₹0.00</p>
                        </div>
                      </label>

                      {/* COD */}
                      <label
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="accent-primary"
                        />
                        <Banknote className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Cash on Delivery</p>
                          <p className="text-[11px] text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </label>
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
                  <div key={item.product.id} className="flex gap-2 text-sm">
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-12 rounded object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{item.product.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.selectedSize} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-discount font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-discount">
                    <span>Coupon ({appliedCoupon?.coupon_code})</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                {coinsValue > 0 && (
                  <div className="flex justify-between text-discount">
                    <span>Loyalty Coins ({coinsToUse})</span>
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
