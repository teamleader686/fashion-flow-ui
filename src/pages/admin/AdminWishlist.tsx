import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Heart,
    Search,
    MessageCircle,
    Mail,
    Filter,
    User,
    Package,
    Calendar,
    ExternalLink,
    Phone
} from 'lucide-react';
import { toast } from 'sonner';
import MarketingDialog from '@/components/admin/MarketingDialog';
import { TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

interface WishlistItem {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
    user_profiles: any;
    products: any;
}

const ITEMS_PER_PAGE = 10;

export default function AdminWishlist() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isMarketingOpen, setIsMarketingOpen] = useState(false);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const { data: wishlistData, error: wishlistError } = await supabase
                .from('wishlist')
                .select('id, user_id, product_id, created_at')
                .order('created_at', { ascending: false });

            if (wishlistError) throw wishlistError;

            if (wishlistData && wishlistData.length > 0) {
                const userIds = Array.from(new Set(wishlistData.map(i => i.user_id).filter(Boolean)));
                const productIds = Array.from(new Set(wishlistData.map(i => i.product_id).filter(Boolean)));

                // Fetch Profiles
                const { data: profiles } = await supabase
                    .from('user_profiles')
                    .select('user_id, full_name, email, phone')
                    .in('user_id', userIds);

                // Fetch Products
                const { data: products } = await supabase
                    .from('products')
                    .select('id, name, slug, price')
                    .in('id', productIds);

                // Merge Data
                const mergedData = wishlistData.map(item => ({
                    ...item,
                    user_profiles: profiles?.find(p => p.user_id === item.user_id),
                    products: products?.find(p => p.id === item.product_id)
                }));

                setItems(mergedData as WishlistItem[]);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error('Error fetching wishlists:', error);
            toast.error('Failed to load wishlist data');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.user_profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user_profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const {
        currentPage,
        totalPages,
        paginatedItems,
        handlePageChange,
        startIndex,
        endIndex,
        totalItems
    } = usePagination(filteredItems, { itemsPerPage: ITEMS_PER_PAGE });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedItems.map(i => i.id));
        }
    };

    const getSelectedData = () => {
        return items
            .filter(i => selectedIds.includes(i.id))
            .map(i => ({
                user_id: i.user_id,
                full_name: i.user_profiles?.full_name,
                email: i.user_profiles?.email,
                phone: i.user_profiles?.phone,
                product_name: i.products?.name,
                product_id: i.product_id,
                product_slug: i.products?.slug
            }));
    };

    const handleWhatsAppClick = async (item: WishlistItem) => {
        const phone = item.user_profiles?.phone;
        const userName = item.user_profiles?.full_name || 'there';
        const productName = item.products?.name || 'this product';
        const productSlug = item.products?.slug;

        // Validate phone number
        if (!phone) {
            toast.error('Phone number not available for this user');
            return;
        }

        // Create product link
        const productLink = `${window.location.origin}/product/${productSlug}`;

        // Create personalized message template
        const message = `Hi ${userName},

You liked this product: ${productName} 😍

Get a special discount using code: SAVE20 🎁

Buy now:
${productLink}`;

        // Clean phone number (remove all non-digit characters)
        const cleanPhone = phone.replace(/\D/g, '');

        // Validate phone number format
        if (cleanPhone.length < 10) {
            toast.error('Invalid phone number format');
            return;
        }

        // Create WhatsApp URL with encoded message
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        try {
            // Log to marketing_logs table
            const { error } = await supabase.from('marketing_logs').insert({
                user_id: item.user_id,
                product_id: item.product_id,
                message_type: 'whatsapp',
                message: message,
                sent_at: new Date().toISOString()
            });

            if (error) {
                console.error('Error logging marketing message:', error);
                // Don't block WhatsApp opening if logging fails
            }

            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            toast.success('WhatsApp opened successfully');
        } catch (error) {
            console.error('Error opening WhatsApp:', error);
            toast.error('Failed to open WhatsApp');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Wishlist Management</h1>
                        <p className="text-muted-foreground mt-1">Track and engage with interested customers</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            disabled={selectedIds.length === 0}
                            onClick={() => setIsMarketingOpen(true)}
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Marketing Outreach ({selectedIds.length})
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="h-4 w-4 text-pink-600" />
                                <p className="text-xs text-muted-foreground">Total Likes</p>
                            </div>
                            <p className="text-2xl font-bold">{items.length}</p>
                        </CardContent>
                    </Card>
                    {/* Add more stats if needed */}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by user or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                    </Button>
                </div>

                {/* Content */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-4"><TableSkeleton rows={10} cols={6} /></div>
                            ) : filteredItems.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">No wishlist data found</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b">
                                            <th className="p-4 w-10 text-left">
                                                <Checkbox
                                                    checked={selectedIds.length > 0 && selectedIds.length === paginatedItems.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-4 text-left font-medium">Customer</th>
                                            <th className="p-4 text-left font-medium">Product</th>
                                            <th className="p-4 text-left font-medium">Price</th>
                                            <th className="p-4 text-left font-medium">Date</th>
                                            <th className="p-4 text-right font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {paginatedItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4">
                                                    <Checkbox
                                                        checked={selectedIds.includes(item.id)}
                                                        onCheckedChange={() => toggleSelect(item.id)}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.user_profiles?.full_name || 'Anonymous'}</span>
                                                        <span className="text-xs text-muted-foreground">{item.user_profiles?.email}</span>
                                                        {item.user_profiles?.phone && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Phone className="h-3 w-3 text-green-600" />
                                                                <span className="text-xs text-muted-foreground">{item.user_profiles?.phone}</span>
                                                            </div>
                                                        )}
                                                        {!item.user_profiles?.phone && (
                                                            <span className="text-xs text-red-500">No phone number</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium line-clamp-1">{item.products?.name}</span>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="h-auto p-0 text-[10px] text-primary"
                                                                onClick={() => window.open(`/product/${item.products?.slug}`, '_blank')}
                                                            >
                                                                View Product <ExternalLink className="h-2 w-2 ml-1" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-semibold">₹{item.products?.price}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                                            onClick={() => handleWhatsAppClick(item)}
                                                            disabled={!item.user_profiles?.phone}
                                                            title={item.user_profiles?.phone ? "Send WhatsApp Message" : "Phone number not available"}
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                            onClick={() => {
                                                                setSelectedIds([item.id]);
                                                                setIsMarketingOpen(true);
                                                            }}
                                                            title="Marketing Outreach"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalItems={totalItems}
                    label="wishlisted items"
                />
            </div>

            <MarketingDialog
                open={isMarketingOpen}
                onOpenChange={setIsMarketingOpen}
                selectedUsers={getSelectedData()}
            />
        </AdminLayout>
    );
}
