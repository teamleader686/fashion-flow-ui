import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBanner from "@/assets/hero-banner-1.jpg";

const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden bg-banner-gradient">
      <div className="container flex flex-col md:flex-row items-center gap-6 py-8 md:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 text-center md:text-left z-10"
        >
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-2">
            New Collection 2026
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Elegance Meets<br />
            <span className="text-primary">Tradition</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-md mx-auto md:mx-0">
            Discover handpicked kurtis, dresses, and sarees crafted with love.
            Up to 60% off on new arrivals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              to="/products?category=all"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Shop Now
            </Link>
            <Link
              to="/products?category=kurtis"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-foreground/20 text-foreground font-semibold text-sm hover:bg-foreground/5 transition-colors"
            >
              Explore Kurtis
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 max-w-sm md:max-w-md lg:max-w-lg"
        >
          <img
            src={heroBanner}
            alt="New fashion collection featuring designer kurti"
            className="w-full h-auto rounded-2xl shadow-lg object-cover aspect-[16/10]"
            loading="eager"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;
