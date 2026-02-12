import Layout from "@/components/layout/Layout";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryCircles from "@/components/home/CategoryCircles";
import OfferBanner from "@/components/home/OfferBanner";
import ProductCard from "@/components/ProductCard";
import ReferralTracker from "@/components/ReferralTracker";
import { useProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";

const Index = () => {
  const { products, loading } = useProducts();
  
  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  const allProducts = products.slice(0, 8);

  return (
    <Layout>
      <ReferralTracker />
      <HeroBanner />
      <CategoryCircles />
      <OfferBanner />

      {/* Featured Products */}
      <section className="py-6 lg:py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold">Loved By All</h2>
            <Link to="/products?category=all" className="text-sm font-semibold text-primary hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-6 lg:py-10 bg-secondary/50">
          <div className="container">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold">New Arrivals</h2>
              <Link to="/products?category=all" className="text-sm font-semibold text-primary hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="py-6 lg:py-10">
        <div className="container">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Pocket-Friendly Picks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 lg:py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-display font-bold text-lg mb-3">StyleBazaar</h4>
              <p className="text-sm text-muted-foreground">Your destination for ethnic & fusion fashion.</p>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3 uppercase tracking-wide">Shop</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/products?category=kurtis" className="hover:text-foreground">Kurtis</Link></li>
                <li><Link to="/products?category=dresses" className="hover:text-foreground">Dresses</Link></li>
                <li><Link to="/products?category=sarees" className="hover:text-foreground">Sarees</Link></li>
                <li><Link to="/products?category=sets" className="hover:text-foreground">Sets</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3 uppercase tracking-wide">Help</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground cursor-pointer">Track Order</span></li>
                <li><span className="hover:text-foreground cursor-pointer">Returns</span></li>
                <li><span className="hover:text-foreground cursor-pointer">FAQ</span></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3 uppercase tracking-wide">Connect</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground cursor-pointer">Instagram</span></li>
                <li><span className="hover:text-foreground cursor-pointer">Facebook</span></li>
                <li><span className="hover:text-foreground cursor-pointer">WhatsApp</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
            © 2026 StyleBazaar. All rights reserved.
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
