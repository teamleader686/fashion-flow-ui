import Layout from "@/components/layout/Layout";
import { User, Package, MapPin, Wallet, Gift, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  { icon: Package, label: "My Orders", desc: "Track, return, or buy again" },
  { icon: MapPin, label: "Addresses", desc: "Manage delivery addresses" },
  { icon: Wallet, label: "My Wallet", desc: "Balance & transactions" },
  { icon: Gift, label: "Rewards & Coins", desc: "Earn & redeem loyalty coins" },
];

const Account = () => {
  return (
    <Layout>
      <div className="container py-4 lg:py-8 max-w-2xl mx-auto">
        {/* Guest state */}
        <div className="bg-card rounded-xl border border-border p-6 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-bold mb-1">Welcome to StyleBazaar</h1>
          <p className="text-sm text-muted-foreground mb-4">Sign in to access your account</p>
          <button className="px-8 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <LogIn className="h-4 w-4 inline-block mr-2" />
            Sign In / Sign Up
          </button>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          {menuItems.map(({ icon: Icon, label, desc }) => (
            <button
              key={label}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Account;
