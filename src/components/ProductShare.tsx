import { Share2, Copy, Send, Mail, Facebook, Twitter, MessageCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Product } from "@/hooks/useProducts";
import { useState } from "react";

interface ProductShareProps {
    product: Product;
    trigger?: React.ReactNode;
    className?: string;
}

const ProductShare = ({ product, trigger, className }: ProductShareProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Use slug as preferred identifier for deep links
    const productUrl = `${window.location.origin}/product/${product.slug || product.id}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(productUrl);
            toast.success("Link copied to clipboard!");
            setIsOpen(false);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    const shareOptions = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            color: "bg-[#25D366] hover:bg-[#25D366]/90",
            url: `https://wa.me/?text=${encodeURIComponent(`Check out this ${product.name} on StyleBazaar: ${productUrl}`)}`,
        },
        {
            name: "Facebook",
            icon: Facebook,
            color: "bg-[#1877F2] hover:bg-[#1877F2]/90",
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
        },
        {
            name: "Twitter",
            icon: Twitter,
            color: "bg-[#1DA1F2] hover:bg-[#1DA1F2]/90",
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${product.name} on StyleBazaar: `)}&url=${encodeURIComponent(productUrl)}`,
        },
        {
            name: "Email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            url: `mailto:?subject=${encodeURIComponent(`Check out this ${product.name}`)}&body=${encodeURIComponent(`I found this amazing ${product.name} on StyleBazaar. Check it out: ${productUrl}`)}`,
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className={`p-1.5 rounded-full hover:bg-secondary transition-colors ${className}`}>
                        <Share2 className="h-4 w-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="w-[92vw] sm:max-w-[420px] p-5 sm:p-6 overflow-hidden">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl">Share Product</DialogTitle>
                    <DialogDescription className="text-sm">
                        Share this product with your friends and family
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-2 overflow-x-hidden">
                    {/* Product Preview */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20 overflow-hidden">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{product.name}</p>
                            <p className="text-xs font-semibold text-pink-600 mt-0.5">₹{product.price.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Share Options Grid */}
                    <div className="grid grid-cols-4 xs:grid-cols-4 gap-2 sm:gap-4">
                        {shareOptions.map((option) => (
                            <a
                                key={option.name}
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group min-w-0"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 group-hover:scale-110 group-active:scale-95 ${option.color}`}>
                                    <option.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate w-full text-center">
                                    {option.name}
                                </span>
                            </a>
                        ))}
                    </div>

                    {/* Copy Link Section */}
                    <div className="space-y-2.5 pt-2">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Or copy link</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-xs truncate select-all min-w-0">
                                {productUrl}
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10 shrink-0 rounded-xl hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
                                onClick={handleCopy}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductShare;
