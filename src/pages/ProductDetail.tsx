import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Heart, Star, ShoppingBag, Truck, RotateCcw, Shield, Coins, Share2, Wallet, Edit, Trash2, X, Check, Save } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { Textarea } from "@/components/ui/textarea";
import ProductShare from "@/components/ProductShare";
import { toast } from "sonner";
import { ProductDetailSkeleton } from "@/components/shimmer/ProductDetailSkeleton";
import SEO from "@/components/layout/SEO";
import { supabase } from "@/lib/supabase";
import CloudImage from "@/components/ui/CloudImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazySection } from "@/components/layout/LazySection";
import ReviewForm from "@/components/reviews/ReviewForm";

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();

  const { addItem, wishlist, toggleWishlist } = useCart();
  const { user } = useAuth();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [purchaseMode, setPurchaseMode] = useState<'money' | 'coins'>('money');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [fetchedProduct, setFetchedProduct] = useState<any | null>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Derive product from context or fetched state
  const product = products.find((p) => p.slug === slug) || fetchedProduct;

  useEffect(() => {
    // Fallback security for global loading
    const timer = setTimeout(() => {
      // setIsFetchingProduct handled by useProducts internal fallback if logic matches
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFetchingProduct(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isFetchingProduct]);

  useEffect(() => {
    if (product?.images?.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [product]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  useEffect(() => {
    // If not found in context list and we have a slug, fetch it individually
    if (!product && slug) {
      const fetchIndividualProduct = async () => {
        try {
          setIsFetchingProduct(true);
          const { data, error } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(name, slug),
              product_images(image_url, is_primary, display_order),
              is_offer_active,
              offer_type,
              offer_value,
              offer_start_date,
              offer_end_date,
              banner_tag,
              product_variants(size, color, color_code, stock_quantity)
            `)
            .eq('slug', slug)
            .single();

          if (error) throw error;

          if (data) {
            const primaryImage = data.product_images?.find((img: any) => img.is_primary);
            const allImages = data.product_images
              ?.sort((a: any, b: any) => a.display_order - b.display_order)
              .map((img: any) => img.image_url) || [];

            let sizes: string[] = data.available_sizes || [];
            if (sizes.length === 0) {
              sizes = [...new Set(data.product_variants?.map((v: any) => v.size).filter(Boolean) as string[] || [])];
            }

            let colors: { name: string; hex: string }[] = data.available_colors || [];
            if (colors.length === 0) {
              const variantColors = data.product_variants?.filter((v: any) => v.color).map((v: any) => ({
                name: v.color,
                hex: v.color_code || '#000000'
              })) || [];

              const uniqueColors = new Map();
              variantColors.forEach((c: any) => {
                if (!uniqueColors.has(c.name)) uniqueColors.set(c.name, c);
              });
              colors = Array.from(uniqueColors.values());
            }

            const now = new Date();
            const hasActiveOffer = data.is_offer_active &&
              (!data.offer_start_date || now >= new Date(data.offer_start_date)) &&
              (!data.offer_end_date || now <= new Date(data.offer_end_date));

            let finalPrice = data.price;
            let discountPercentage = data.compare_at_price
              ? Math.round(((data.compare_at_price - data.price) / data.compare_at_price) * 100)
              : 0;
            let originalPrice = data.compare_at_price || data.price;

            if (hasActiveOffer) {
              originalPrice = data.price;
              if (data.offer_type === 'percentage') {
                finalPrice = data.price - (data.price * data.offer_value) / 100;
                discountPercentage = Math.max(discountPercentage, data.offer_value);
              } else if (data.offer_type === 'flat') {
                finalPrice = data.price - data.offer_value;
                discountPercentage = Math.max(discountPercentage, Math.round((data.offer_value / data.price) * 100));
              }
            }

            const transformed = {
              id: data.id,
              name: data.name,
              slug: data.slug,
              price: finalPrice,
              originalPrice: originalPrice,
              discount: discountPercentage,
              bestPrice: Math.round(finalPrice * 0.9),
              image: primaryImage?.image_url || allImages[0] || '/placeholder.svg',
              images: allImages.length > 0 ? allImages : ['/placeholder.svg'],
              rating: 4.5,
              reviewCount: 0,
              category: data.category?.slug || 'uncategorized',
              colors,
              sizes,
              isNew: data.is_new_arrival || false,
              isFeatured: data.is_featured || false,
              description: data.description || '',
              stock: data.stock_quantity,
              loyaltyCoins: data.loyalty_coins_reward || 0,
              loyaltyPrice: data.loyalty_coins_price || null,
              shippingCharge: data.shipping_charge || 0,
              isOfferActive: hasActiveOffer,
              bannerTag: data.banner_tag,
              offerType: data.offer_type,
              offerValue: data.offer_value
            };
            setFetchedProduct(transformed);
          }
        } catch (err) {
          console.error("Error fetching individual product:", err);
        } finally {
          setTimeout(() => {
            setIsFetchingProduct(false);
          }, 300);
        }
      };

      fetchIndividualProduct();
    }
  }, [slug, product]);

  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Fetch tab data when activeTab changes or product loads
  useEffect(() => {
    // Only fetch if we have a product and data hasn't been loaded yet
    if (product && activeTab === "reviews" && reviews.length === 0) {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true);
          const { data, error } = await supabase
            .from('product_reviews')
            .select(`
              *,
              users:user_profiles(full_name)
            `)
            .eq('product_id', product.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setReviews(data || []);
        } catch (error) {
          console.error("Error fetching reviews:", error);
        } finally {
          setLoadingReviews(false);
        }
      };

      fetchReviews();
    }
  }, [activeTab, product?.id]); // Depend on product.id to handle page load scenario

  // Scroll to top on mount or slug change
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveTab("description");
    setReviews([]);
  }, [slug]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('loyalty_wallet')
        .select('available_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setWalletBalance(data.available_balance);
      }
    };
    fetchBalance();
  }, [user]);

  const displayPrice = product?.price || 0;
  const oldPrice = product?.originalPrice || 0;
  const discount = product?.discount || 0;
  const has_offer = !!product?.isOfferActive;
  const bannerTag = product?.bannerTag;

  // Review management states
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);

  const handleEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditContent(review.comment);
    setEditRating(review.rating);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditContent("");
    setEditRating(0);
  };

  const handleSaveReview = async () => {
    if (!editingReviewId) return;

    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          comment: editContent,
          rating: editRating,
          updated_at: new Date(),
        })
        .eq("id", editingReviewId);

      if (error) throw error;

      toast.success("Review updated successfully!");

      // Update local state
      setReviews(prev => prev.map(r =>
        r.id === editingReviewId
          ? { ...r, comment: editContent, rating: editRating, updated_at: new Date().toISOString() }
          : r
      ));

      handleCancelEdit();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Review deleted successfully");
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  if (loading || isFetchingProduct) {
    return (
      <Layout>
        <ProductDetailSkeleton />
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/products?category=all" className="text-primary hover:underline">
            Browse products
          </Link>
        </div>
      </Layout>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const canBuyWithCoins = product.loyaltyPrice && product.loyaltyPrice > 0;
  const sufficientBalance = walletBalance !== null && product.loyaltyPrice ? walletBalance >= product.loyaltyPrice : false;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (purchaseMode === 'coins') {
      if (!user) {
        toast.error("Please login to pay with coins");
        return;
      }
      if (!sufficientBalance) {
        toast.error("Insufficient coin balance");
        return;
      }
    }

    addItem(product, selectedSize, selectedColor || (product.colors[0]?.name || ""), purchaseMode === 'coins', null);
    toast.success(purchaseMode === 'coins' ? "Added to cart with Coin payment!" : "Added to cart!");
  };

  return (
    <Layout>
      <SEO
        title={product.name}
        description={product.description}
        image={product.image}
        url={window.location.href}
        type="product"
      />
      <div className="container py-4 lg:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-foreground capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Image Gallery */}
          <div className="lg:w-1/2 flex flex-col gap-4">
            {/* Desktop: Main Image + Thumbnails */}
            <div className="hidden lg:flex gap-4">
              {/* Thumbnails Sidebar */}
              <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'
                      }`}
                  >
                    <CloudImage src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main Image View */}
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 aspect-square rounded-2xl overflow-hidden bg-secondary border shadow-sm group cursor-crosshair relative"
              >
                <CloudImage
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full"
                  imageClassName="w-full h-full object-cover transition-transform duration-700 hover:scale-125"
                />
              </motion.div>
            </div>

            {/* Mobile: Swipeable Slider */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden rounded-2xl border" ref={emblaRef}>
                <div className="flex">
                  {product.images.map((img: string, idx: number) => (
                    <div key={idx} className="flex-[0_0_100%] min-w-0 aspect-square">
                      <CloudImage
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full"
                        imageClassName="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Slider Dots */}
              {product.images.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {product.images.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => scrollTo(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${selectedIndex === idx ? 'w-6 bg-primary' : 'w-1.5 bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:w-1/2 space-y-5"
          >
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-sm font-semibold">{product.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{product.reviewCount} reviews</span>
              </div>
            </div>

            {/* Price section - Dynamic based on mode */}
            <div className="space-y-1">
              {purchaseMode === 'money' ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
                    {oldPrice > displayPrice && (
                      <span className="text-original-price text-lg line-through">₹{oldPrice.toLocaleString()}</span>
                    )}
                    {discount > 0 && (
                      <span className="text-discount font-bold text-lg text-pink-600">
                        {Math.round(discount)}% off
                      </span>
                    )}
                  </div>
                  {has_offer && bannerTag && (
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm bg-pink-600"
                      >
                        {bannerTag}
                      </span>
                    </div>
                  )}
                  {product.bestPrice && !has_offer && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-best-price-bg text-best-price-text px-2.5 py-1 rounded-full">
                      ✨ Best Price ₹{product.bestPrice.toLocaleString()}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {product.shippingCharge > 0 ? `Shipping: ₹${product.shippingCharge}` : 'Free Delivery'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2 text-purple-700">
                  <Coins className="h-6 w-6" />
                  <span className="text-3xl font-bold">{product.loyaltyPrice?.toLocaleString()} Coins</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">inclusive of all taxes</p>
            </div>

            {/* Purchase Mode Toggle */}
            {canBuyWithCoins && (
              <div className="bg-secondary/30 p-1 rounded-lg flex gap-1 border border-border">
                <button
                  onClick={() => setPurchaseMode('money')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${purchaseMode === 'money'
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                >
                  <span>₹</span> Buy with Money
                </button>
                <button
                  onClick={() => setPurchaseMode('coins')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${purchaseMode === 'coins'
                    ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200'
                    : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                >
                  <Coins className="h-4 w-4" />
                  Buy with Coins
                </button>
              </div>
            )}

            {/* Wallet Info if in Coin Mode */}
            {purchaseMode === 'coins' && user && (
              <div className={`p-3 rounded-lg border flex items-center justify-between ${sufficientBalance ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <Wallet className={`h-4 w-4 ${sufficientBalance ? 'text-green-600' : 'text-red-500'}`} />
                  <span className={`text-sm font-medium ${sufficientBalance ? 'text-green-800' : 'text-red-700'}`}>
                    Wallet Balance: {walletBalance?.toLocaleString() ?? 0} Coins
                  </span>
                </div>
                {!sufficientBalance && (
                  <span className="text-xs text-red-600 bg-white/50 px-2 py-1 rounded">
                    Need {((product.loyaltyPrice || 0) - (walletBalance || 0)).toLocaleString()} more
                  </span>
                )}
              </div>
            )}

            {/* Loyalty Earn Info (only in money mode) */}
            {purchaseMode === 'money' && product.loyaltyCoins && product.loyaltyCoins > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Coins className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 text-sm mb-1">
                      Loyalty Rewards
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Earn <span className="font-bold">{product.loyaltyCoins} loyalty coins</span> when you purchase this product!
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Use coins to get discounts or buy products for free.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Select Color</h3>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all relative ${selectedColor === color.name ? "border-primary scale-110" : "border-border"
                        }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: <span className="font-medium text-foreground">{selectedColor}</span>
                  </p>
                )}
              </div>
            )}

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedSize === size
                      ? "bg-foreground text-card border-foreground"
                      : "border-border hover:bg-secondary"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={purchaseMode === 'coins' && !sufficientBalance}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-opacity ${purchaseMode === 'coins'
                  ? sufficientBalance
                    ? 'bg-purple-600 text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
              >
                <ShoppingBag className="h-4 w-4" />
                {purchaseMode === 'coins' ? `Redeem for ${product.loyaltyPrice} Coins` : 'Add to Cart'}
              </button>

              <div className="flex gap-2">
                <ProductShare
                  product={product}
                  trigger={
                    <button className="px-4 py-3 rounded-full border-2 border-border hover:bg-secondary transition-colors">
                      <Share2 className="h-5 w-5" />
                    </button>
                  }
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`px-4 py-3 rounded-full border-2 transition-colors ${isWishlisted ? "border-accent bg-accent/10" : "border-border hover:bg-secondary"
                    }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-accent text-accent" : ""}`} />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-[11px] text-muted-foreground">
                  {product.shippingCharge > 0 ? `₹${product.shippingCharge} Shipping` : 'Free Delivery'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span className="text-[11px] text-muted-foreground">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-[11px] text-muted-foreground">Quality Assured</span>
              </div>
            </div>


            <div className="pt-4 border-t border-border">
              <Tabs defaultValue="description" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                  <TabsTrigger
                    value="description"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  >
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  >
                    Reviews ({reviews.length > 0 ? reviews.length : 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                  >
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="pt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                </TabsContent>

                <TabsContent value="reviews" className="pt-4 space-y-8">
                  {/* Reviews List */}
                  {loadingReviews ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{
                            // Calculate average from approved reviews only
                            (reviews.filter(r => r.is_approved).reduce((acc, r) => acc + r.rating, 0) / (reviews.filter(r => r.is_approved).length || 1)).toFixed(1)
                          }</span>
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i < Math.round(reviews.filter(r => r.is_approved).reduce((acc, r) => acc + r.rating, 0) / (reviews.filter(r => r.is_approved).length || 1))
                                  ? "fill-current"
                                  : "text-muted-foreground"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-muted-foreground text-sm ml-2">
                            ({reviews.filter(r => r.is_approved).length} reviews)
                          </span>
                        </div>
                      </div>

                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-border pb-6 last:border-0">
                          {editingReviewId === review.id ? (
                            <div className="space-y-4 bg-muted/40 p-4 rounded-lg">
                              <div className="flex gap-2 items-center">
                                <span className="text-sm font-medium">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setEditRating(star)}
                                      className="focus:outline-none"
                                    >
                                      <Star
                                        className={`h-5 w-5 ${star <= editRating
                                          ? "fill-yellow-500 text-yellow-500"
                                          : "text-muted-foreground"
                                          }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded text-muted-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveReview}
                                  className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                  {review.users?.full_name?.[0] || 'U'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm">{review.users?.full_name || 'Anonymous User'}</p>
                                  </div>
                                  <div className="flex text-yellow-500 text-xs gap-0.5 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted-foreground"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                  {/* Edit/Delete Controls for Owner */}
                                  {user && user.id === review.user_id && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditReview(review)}
                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                        title="Edit Review"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteReview(review.id)}
                                        className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors"
                                        title="Delete Review"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground ml-11 leading-relaxed whitespace-pre-wrap">
                                {review.comment}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                      <div className="flex justify-center mb-3">
                        <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                          <Star className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">No reviews yet</h3>
                      <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Be the first to share your thoughts about this product!
                      </p>
                    </div>
                  )}

                  {/* Write a Review Section */}
                  {user ? (
                    <ReviewForm
                      productId={product.id}
                      userId={user.id}
                      onReviewSubmitted={() => {
                        // Re-fetch reviews - this must fetch pending ones too now!
                        // The fetchReviews function defined above handles this correctly
                        // by relying on RLS and omitting is_approved filter.
                        const fetchReviews = async () => {
                          const { data } = await supabase
                            .from('product_reviews')
                            .select(`
                              *,
                              users:user_profiles(full_name)
                            `)
                            .eq('product_id', product.id)
                            .order('created_at', { ascending: false });

                          if (data) setReviews(data);
                        };
                        fetchReviews();
                      }}
                    />
                  ) : (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                      <p className="text-sm font-medium mb-3">Please sign in to write a review</p>
                      <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                        Sign In
                      </Link>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium capitalize">{product.category}</span>
                    </div>
                    {product.stock > 0 ? (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Stock Status</span>
                        <span className="font-medium text-green-600">In Stock ({product.stock})</span>
                      </div>
                    ) : (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Stock Status</span>
                        <span className="font-medium text-red-600">Out of Stock</span>
                      </div>
                    )}
                    {/* Add more details if available, e.g. SKU, Material, etc. */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <LazySection>
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-4">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          </LazySection>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
