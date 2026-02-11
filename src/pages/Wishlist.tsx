import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/data/mockData";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const { wishlist } = useCart();
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <Layout>
      <div className="container py-4 lg:py-8">
        <h1 className="text-xl lg:text-2xl font-bold mb-4">
          My Wishlist ({wishlist.length})
        </h1>

        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">Save items you love for later</p>
            <Link
              to="/products?category=all"
              className="inline-flex px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
