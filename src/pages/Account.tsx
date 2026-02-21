import Layout from "@/components/layout/Layout";
import { User, Package, MapPin, Wallet, Gift, LogIn, Settings, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Package, label: "My Orders", desc: "Track, return, or buy again", link: "/my-orders", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Heart, label: "Wishlist", desc: "Your favorite items", link: "/wishlist", color: "text-pink-500", bg: "bg-pink-50" },
  { icon: MapPin, label: "Addresses", desc: "Manage delivery addresses", link: "/addresses", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: Wallet, label: "My Wallet & Rewards", desc: "Balance, coins & transactions", link: "/wallet", color: "text-emerald-500", bg: "bg-emerald-50" },
];

// ... imports
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, HelpCircle, MessageSquare, ChevronRight } from "lucide-react";
import { toast } from "sonner";
// ... existing code

const Account = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [pages, setPages] = useState<{ slug: string; title: string }[]>([]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  useEffect(() => {
    supabase.from("pages").select("slug, title").eq("is_active", true)
      .then(({ data }) => setPages(data || []));
  }, []);

  // ... loading check

  return (
    <Layout>
      <div className="container py-4 lg:py-8 max-w-2xl mx-auto space-y-8">
        {/* ... Profile Card ... */}
        {user ? (
          <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 rounded-2xl border border-primary/10 p-6 relative overflow-hidden group">
            {/* ... profile content ... */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User size={120} />
            </div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20 shrink-0">
                {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold tracking-tight">{profile?.full_name || 'User'}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          // ... guest content ...
          <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold mb-2">Welcome to StyleBazaar</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign in to track orders, manage addresses and more.</p>
            <Button asChild className="rounded-full px-10">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In / Sign Up
              </Link>
            </Button>
          </div>
        )}

        {/* Menu items */}
        <div className="grid gap-3">
          {menuItems.map(({ icon: Icon, label, desc, link, color, bg }) => (
            <Link
              key={label}
              to={link}
              className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border/60 hover:border-primary/50 hover:shadow-sm transition-all text-left"
            >
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>

        {/* Legal & Support Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold ml-1">Legal & Support</h3>
          <div className="bg-card rounded-xl border border-border/60 divide-y">
            {pages.map((page) => (
              <Link
                key={page.slug}
                to={`/pages/${page.slug}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{page.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {/* Static Links for FAQ & Contact */}
            <Link to="#" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">FAQ</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="#" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Contact Us</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {user && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-destructive hover:underline transition-all"
            >
              Log Out From Account
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Account;
