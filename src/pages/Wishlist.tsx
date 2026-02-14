import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const { wishlist } = useCart();
  const { products, loading } = useProducts();
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <Layout>
      <div className="bg-muted/30 min-h-[calc(100vh-80px)]">
        <div className="container py-8 lg:py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Wishlist</h1>
              <p className="text-muted-foreground mt-1">
                You have {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved for later
              </p>
            </div>
            {wishlist.length > 0 && (
              <Link to="/products">
                <Button variant="outline" className="rounded-full">
                  Continue Shopping
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="flex flex-col h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-20 px-6 bg-background rounded-3xl border border-dashed border-border shadow-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8">
                Explore our collections and save your favorite items to view them here later.
              </p>
              <Link to="/products">
                <Button className="rounded-full px-8 h-11 bg-primary hover:bg-primary/90">
                  Start Shopping
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
