import { Home, LayoutGrid, Tag, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutGrid, label: "Categories", path: "/products?category=all" },
  { icon: Tag, label: "Offers", path: "/offers" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: User, label: "Account", path: "/account" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { wishlist } = useCart();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path.split("?")[0]));
          return (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label === "Wishlist" && wishlist.length > 0 && (
                <span className="absolute -top-0.5 right-1 bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
