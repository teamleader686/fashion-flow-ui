import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { CheckCircle2, Package, Home } from "lucide-react";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || "SB00000000";

  return (
    <Layout>
      <div className="container py-12 lg:py-20 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="h-20 w-20 mx-auto text-primary mb-4" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground text-sm mb-1">Thank you for shopping with StyleBazaar</p>
          <p className="text-sm">
            Order ID: <span className="font-bold text-primary">{orderNumber}</span>
          </p>

          <div className="bg-card rounded-xl border border-border p-5 mt-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Estimated Delivery</p>
                <p className="text-xs text-muted-foreground">3-5 business days</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive an email & SMS confirmation with tracking details soon.
            </p>
            <p className="text-xs font-medium text-discount">
              🎉 You earned loyalty coins on this order!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              <Home className="h-4 w-4" />
              Continue Shopping
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-border font-semibold text-sm hover:bg-secondary"
            >
              <Package className="h-4 w-4" />
              Track Order
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderSuccess;
