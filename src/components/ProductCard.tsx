import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";

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
      <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
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
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className="flex-shrink-0 p-1"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isWishlisted ? "fill-accent text-accent" : "text-muted-foreground"
              }`}
            />
          </button>
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

        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.colors.slice(0, 4).map((color) => (
              <div
                key={color}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
