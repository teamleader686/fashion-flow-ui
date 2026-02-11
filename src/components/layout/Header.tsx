import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Women", href: "/products?category=all" },
  { label: "Kurtis", href: "/products?category=kurtis" },
  { label: "Dresses", href: "/products?category=dresses" },
  { label: "Sarees", href: "/products?category=sarees" },
  { label: "Sets", href: "/products?category=sets" },
  { label: "Offers", href: "/offers" },
];

const Header = () => {
  const { totalItems, wishlist } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Top bar - desktop */}
      <div className="container hidden lg:flex items-center justify-between py-3">
        <Link to="/" className="font-display text-2xl font-bold italic text-foreground">
          StyleBazaar
        </Link>

        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search kurtis, dresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-border bg-secondary px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </form>

          <Link to="/wishlist" className="relative p-2 hover:bg-secondary rounded-full transition-colors">
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <Link to="/account" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        <button onClick={() => setMenuOpen(true)} className="p-1">
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="font-display text-xl font-bold italic text-foreground">
          StyleBazaar
        </Link>

        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-1">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/cart" className="relative p-1">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden border-t border-border"
          >
            <form onSubmit={handleSearch} className="px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search kurtis, dresses, sarees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full rounded-full border border-border bg-secondary px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-card z-50 shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display text-xl font-bold italic">StyleBazaar</span>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 px-3 rounded-lg text-foreground hover:bg-secondary font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border my-3" />
                <Link to="/account" onClick={() => setMenuOpen(false)} className="block py-3 px-3 rounded-lg text-foreground hover:bg-secondary font-medium">
                  My Account
                </Link>
                <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block py-3 px-3 rounded-lg text-foreground hover:bg-secondary font-medium">
                  Wishlist ({wishlist.length})
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
