import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Wallet as WalletIcon,
    TrendingDown,
    TrendingUp,
    History,
    ArrowRight,
    ShoppingBag,
    RefreshCw,
    Gift,
    Coins,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Wallet = () => {
    const navigate = useNavigate();
    const { wallet, transactions, loading, refetch } = useWallet();

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    if (loading && !wallet) {
        return (
            <Layout>
                <div className="container max-w-7xl mx-auto p-4 space-y-8 py-12">
                    <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                        ))}
                    </div>
                    <div className="h-96 bg-muted animate-pulse rounded-xl" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
                <div className="container max-w-7xl mx-auto p-4 space-y-8 py-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight">My Wallet</h1>
                            <p className="text-muted-foreground mt-1 text-lg">
                                Manage your loyalty coins and track your rewards
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-full">
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button onClick={() => navigate('/products')} className="rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
                                Earn More
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-8"
                    >
                        {/* Main Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Balance Card */}
                            <motion.div variants={itemVariants}>
                                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary via-primary/90 to-blue-600 text-white shadow-2xl">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <WalletIcon size={120} />
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-primary-foreground/80 font-medium text-sm flex items-center gap-2">
                                            <WalletIcon size={16} />
                                            Current Balance
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black">
                                                {wallet?.available_balance || 0}
                                            </span>
                                            <span className="text-lg font-medium opacity-80">Coins</span>
                                        </div>
                                        <p className="mt-4 text-xs font-medium opacity-70 flex items-center gap-1">
                                            <Gift size={12} />
                                            1 Coin = ₹1.00 Discount
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Total Earned */}
                            <motion.div variants={itemVariants}>
                                <Card className="h-full border-none shadow-xl bg-white dark:bg-slate-900 border-l-4 border-l-green-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                                            <TrendingUp className="text-green-500" size={16} />
                                            Lifetime Earnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                                                {wallet?.total_earned || 0}
                                            </span>
                                            <span className="text-sm font-medium text-muted-foreground">Coins</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Across all orders</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                Active Earning
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Total Redeemed */}
                            <motion.div variants={itemVariants}>
                                <Card className="h-full border-none shadow-xl bg-white dark:bg-slate-900 border-l-4 border-l-amber-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-muted-foreground font-medium text-sm flex items-center gap-2">
                                            <TrendingDown className="text-amber-500" size={16} />
                                            Total Redeemed
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                                                {wallet?.total_redeemed || 0}
                                            </span>
                                            <span className="text-sm font-medium text-muted-foreground">Coins</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Savings applied</span>
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                                                Verified
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Transaction History */}
                        <motion.div variants={itemVariants} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History size={20} className="text-primary" />
                                    <h2 className="text-xl font-bold">Transaction History</h2>
                                </div>
                                <Badge variant="outline" className="px-3 py-1 font-medium">
                                    {transactions.length} Total
                                </Badge>
                            </div>

                            {transactions.length === 0 ? (
                                <Card className="border-dashed py-20 text-center bg-transparent">
                                    <CardContent className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                            <History size={32} className="text-muted-foreground opacity-40" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold">No transactions yet</p>
                                            <p className="text-muted-foreground text-sm max-w-[250px]">
                                                Start shopping to earn your first loyalty coins!
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="mt-2">
                                            View Shop
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {transactions.map((tx) => (
                                        <Card key={tx.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'earn' || (tx.type === 'admin_adjust' && tx.coins > 0) || tx.type === 'refund'
                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {tx.type === 'earn' ? <ShoppingBag size={22} /> :
                                                            tx.type === 'redeem' ? <TrendingDown size={22} /> :
                                                                tx.type === 'refund' ? <RefreshCw size={22} /> : <Gift size={22} />}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <h3 className="font-bold flex items-center gap-2 capitalize">
                                                            {tx.type.replace('_', ' ')}
                                                            {tx.order_id && (
                                                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                                                                    Order Ref
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{tx.description}</p>
                                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <History size={10} />
                                                                {format(new Date(tx.created_at), 'PPP')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <AlertCircle size={10} />
                                                                Balance: {tx.balance_after}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
                                                    <div className={`text-2xl font-black ${tx.type === 'earn' || (tx.type === 'admin_adjust' && tx.coins > 0) || tx.type === 'refund'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {tx.coins > 0 ? '+' : ''}{tx.coins}
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                                                        {tx.status}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Info Section */}
                        <motion.div variants={itemVariants}>
                            <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
                                <div className="absolute -bottom-12 -right-12 text-primary/10 rotate-12">
                                    <Coins size={200} />
                                </div>
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
                                        <Gift size={24} />
                                        How Loyalty Coins Work
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                                            <h4 className="font-bold">Shop & Earn</h4>
                                            <p className="text-sm text-muted-foreground">Every ₹10 spent earns 1 coin credited on delivery.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                                            <h4 className="font-bold">Redeem Any Time</h4>
                                            <p className="text-sm text-muted-foreground">Use coins during checkout for instant discounts.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
                                            <h4 className="font-bold">Safe Refunds</h4>
                                            <p className="text-sm text-muted-foreground">If you cancel, redeemed coins are refunded to your wallet.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">4</div>
                                            <h4 className="font-bold">Exclusive Benefits</h4>
                                            <p className="text-sm text-muted-foreground">Get early access to sales with your loyalty status.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default Wallet;
