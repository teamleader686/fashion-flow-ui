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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Product</DialogTitle>
                    <DialogDescription>
                        Share this product with your friends and family
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {shareOptions.map((option) => (
                            <a
                                key={option.name}
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 ${option.color}`}>
                                    <option.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">{option.name}</span>
                            </a>
                        ))}
                    </div>

                    <div className="space-y-2 pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or copy link</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs truncate select-all">
                                {productUrl}
                            </div>
                            <Button size="icon" variant="outline" className="h-9 w-9 rounded-lg" onClick={handleCopy}>
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
