import { Heart, Star, Coins, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import ProductShare from "./ProductShare";
import CloudImage from "@/components/ui/CloudImage";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { wishlist, toggleWishlist } = useCart();
  const isWishlisted = wishlist.includes(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
    >
      <Link to={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden">
        <CloudImage
          src={product.image}
          alt={product.name}
          className="w-full h-full"
          imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
            New
          </span>
        )}
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-offer-badge text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
            {product.discount}% OFF
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <Star className="h-3 w-3 fill-star text-star" />
          <span className="text-xs font-semibold">{product.rating}</span>
        </div>
      </Link>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/product/${product.slug}`} className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
            <ProductShare product={product} />
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className="p-1"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-accent text-accent" : "text-muted-foreground"
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-bold text-foreground">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-original-price text-xs">₹{product.originalPrice.toLocaleString()}</span>
              <span className="text-discount text-xs font-semibold">{product.discount}% off</span>
            </>
          )}
        </div>

        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-best-price-bg text-best-price-text px-2 py-0.5 rounded-full">
            ✨ Best Price ₹{product.bestPrice.toLocaleString()}
          </span>
        </div>

        {/* Loyalty Coins Badge */}
        {(product.loyaltyCoins > 0 || (product.loyaltyPrice && product.loyaltyPrice > 0)) && (
          <div className="mt-1.5 flex flex-col items-start gap-1">
            {product.loyaltyCoins > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                <Coins className="h-3 w-3" />
                Earn {product.loyaltyCoins} coins
              </span>
            )}
            {product.loyaltyPrice && product.loyaltyPrice > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                <Coins className="h-3 w-3" />
                Buy for {product.loyaltyPrice} coins
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {product.sizes.length > 0 && (
            <div className="flex gap-1 text-[10px] text-muted-foreground">
              {product.sizes.slice(0, 3).map((size) => (
                <span key={size} className="bg-secondary px-1.5 py-0.5 rounded-sm border border-border">
                  {size}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="bg-secondary px-1.5 py-0.5 rounded-sm border border-border">
                  +{product.sizes.length - 3}
                </span>
              )}
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {product.colors.slice(0, 4).map((color) => (
                <div
                  key={color.name}
                  className="w-3.5 h-3.5 rounded-full border border-border relative group/color"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </div>
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
