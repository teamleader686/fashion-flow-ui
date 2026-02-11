import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/mockData";

const Offers = () => {
  const discountedProducts = [...products].sort((a, b) => b.discount - a.discount);

  return (
    <Layout>
      <div className="container py-4 lg:py-8">
        {/* Offer banners */}
        <div className="rounded-2xl bg-gradient-to-r from-accent/15 via-accent/5 to-primary/15 p-6 md:p-10 mb-6 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">
            🎉 Mega <span className="text-accent">Sale</span> is Live!
          </h1>
          <p className="text-muted-foreground">Up to 60% off on all categories</p>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 mb-6 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {["WELCOME50", "FLAT200", "FESTIVE30"].map((code) => (
            <div key={code} className="flex-shrink-0 px-4 py-2 bg-secondary rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Use code</p>
              <p className="font-bold text-sm text-primary">{code}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4">Best Deals</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {discountedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Offers;
