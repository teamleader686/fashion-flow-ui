import { Heart, Share2, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import ProductShare from "./ProductShare";
import CloudImage from "@/components/ui/CloudImage";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useCart();
  const isWishlisted = wishlist.includes(product.id);

  const displayPrice = product.price;
  const oldPrice = product.originalPrice || 0;
  const discount = product.discount || 0;
  const has_offer = product.isOfferActive && product.price < (product.originalPrice || Infinity);
  const bannerTag = product.bannerTag;

  const handleCardClick = () => {
    navigate(`/product/${product.slug}`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-pink-100 flex flex-col h-full"
    >
      {/* Image Section - 1:1 Ratio */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <CloudImage
          src={product.image}
          alt={product.name}
          className="w-full h-full"
          imageClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Discount Badge */}
        {/* Dynamic Offer Badge */}
        {has_offer && (
          <div
            className="absolute top-3 left-3 bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg"
          >
            {bannerTag || `${Math.round(discount)}% OFF`}
          </div>
        )}

        {/* Fallback Static Discount Badge (if no dynamic offer but has discount) */}
        {!has_offer && product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
            {product.discount}% OFF
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="text-[14px] font-medium text-gray-800 line-clamp-1 mb-1 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-gray-900">
            ₹{displayPrice.toLocaleString()}
          </span>
          {oldPrice > displayPrice && (
            <span className="text-[11px] text-gray-400 line-through">
              ₹{oldPrice.toLocaleString()}
            </span>
          )}
          <span className="text-[10px] ml-auto font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
            {product.shippingCharge > 0 ? `+₹${product.shippingCharge} ship` : 'Free Shipping'}
          </span>
        </div>

        {/* Loyalty Coins Section */}
        {(product.loyaltyCoins > 0 || (product.loyaltyPrice && product.loyaltyPrice > 0)) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {product.loyaltyCoins > 0 && (
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                <Coins className="h-3 w-3" />
                <span>Earn {product.loyaltyCoins} Coins</span>
              </div>
            )}
            {product.loyaltyPrice && product.loyaltyPrice > 0 && (
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600">
                <Coins className="h-3 w-3" />
                <span>Buy for {product.loyaltyPrice} Coins</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Moved Below Content */}
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistClick}
              className={`p-1.5 transition-all duration-300 ${isWishlisted
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
                }`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`h-5 w-5 transition-all duration-300 ${isWishlisted ? "fill-current" : ""}`}
                strokeWidth={isWishlisted ? 2 : 1.5}
              />
            </motion.button>

            <div onClick={handleShareClick}>
              <ProductShare
                product={product}
                trigger={
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-all duration-300"
                    aria-label="Share product"
                  >
                    <Share2 className="h-5 w-5" strokeWidth={1.5} />
                  </motion.button>
                }
              />
            </div>
          </div>

          <button className="text-[11px] font-bold text-gray-400 hover:text-pink-600 uppercase tracking-tight transition-colors">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
