import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Heart, Star, ShoppingBag, Truck, RotateCcw, Shield, ChevronLeft, Coins, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import ProductShare from "@/components/ProductShare";
import { toast } from "sonner";
import { ProductDetailSkeleton } from "@/components/shimmer/ProductDetailSkeleton";
import { useEffect } from "react";
import SEO from "@/components/layout/SEO";

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.slug === slug);
  const { addItem, wishlist, toggleWishlist } = useCart();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Scroll to top on mount or slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
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

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addItem(product, selectedSize, selectedColor || product.colors[0]);
    toast.success("Added to cart!");
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
          {/* Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:w-1/2"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

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

            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">₹{product.price.toLocaleString()}</span>
                <span className="text-original-price text-base">₹{product.originalPrice.toLocaleString()}</span>
                <span className="text-discount font-semibold">{product.discount}% off</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-best-price-bg text-best-price-text px-2.5 py-1 rounded-full">
                ✨ Best Price ₹{product.bestPrice.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground">inclusive of all taxes</p>
            </div>

            {/* Loyalty Coins Section */}
            {product.loyaltyCoins && product.loyaltyCoins > 0 && (
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
                      Use coins to get discounts on future purchases • 1 coin = ₹1
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Color</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? "border-primary scale-110" : "border-border"
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

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
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
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
                <span className="text-[11px] text-muted-foreground">Free Delivery</span>
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

            {/* Description */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-sm mb-2">Product Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
