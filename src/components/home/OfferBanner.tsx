import { Link } from "react-router-dom";

const OfferBanner = () => {
  return (
    <section className="py-6 lg:py-8">
      <div className="container">
        <div className="rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold">
              Flat <span className="text-accent">50% OFF</span> on First Order
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use code <span className="font-bold text-foreground">WELCOME50</span> at checkout
            </p>
          </div>
          <Link
            to="/products?category=all"
            className="inline-flex items-center px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
