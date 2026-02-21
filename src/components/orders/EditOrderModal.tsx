import { Order, OrderItem } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Package, MapPin, Info } from 'lucide-react';
import { toast } from 'sonner';

interface EditOrderModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EditOrderModal({
    order,
    open,
    onClose,
    onUpdate,
}: EditOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [address, setAddress] = useState({
        line1: '',
        city: '',
        state: '',
        zip: '',
    });
    const [specialNotes, setSpecialNotes] = useState('');

    useEffect(() => {
        if (order && open) {
            setItems(order.order_items ? [...order.order_items] : []);
            setAddress({
                line1: order.shipping_address_line1 || '',
                city: order.shipping_city || '',
                state: order.shipping_state || '',
                zip: order.shipping_zip || '',
            });
            setSpecialNotes((order as any).special_notes || '');
        }
    }, [order, open]);

    const handleItemChange = (
        index: number,
        field: keyof OrderItem,
        value: string | number
    ) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'quantity') {
            const qty = Math.max(1, Number(value));
            item.quantity = qty;
            item.total_price = qty * item.unit_price;
        } else {
            (item as any)[field] = value;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total_price, 0);
    };

    const currentSubtotal = calculateSubtotal();
    const currentTotal =
        currentSubtotal +
        ((order?.shipping_cost || order?.shipping_charge) || 0) -
        (order?.discount_amount || 0);

    const handleSubmit = async () => {
        if (!order) return;

        if (!address.line1 || !address.city || !address.state || !address.zip) {
            toast.error('Please fill out all address fields.');
            return;
        }

        try {
            setLoading(true);

            for (const item of items) {
                const { error: itemError } = await supabase
                    .from('order_items')
                    .update({
                        quantity: item.quantity,
                        size: item.size,
                        color: item.color,
                        total_price: item.total_price,
                    })
                    .eq('id', item.id);

                if (itemError) throw itemError;
            }

            const { error: orderError } = await supabase
                .from('orders')
                .update({
                    shipping_address_line1: address.line1,
                    shipping_city: address.city,
                    shipping_state: address.state,
                    shipping_zip: address.zip,
                    special_notes: specialNotes,
                    subtotal: currentSubtotal,
                    total_amount: currentTotal,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

            let finalError = orderError;
            if (orderError && orderError.message.includes('special_notes')) {
                console.warn('special_notes column missing, saving without it');
                const { error: retryError } = await supabase
                    .from('orders')
                    .update({
                        shipping_address_line1: address.line1,
                        shipping_city: address.city,
                        shipping_state: address.state,
                        shipping_zip: address.zip,
                        subtotal: currentSubtotal,
                        total_amount: currentTotal,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', order.id);
                finalError = retryError;
            }

            if (finalError) throw finalError;

            toast.success('Order updated successfully!');
            onUpdate();
            onClose();
        } catch (err: any) {
            console.error('Error updating order:', err);
            toast.error('Failed to update order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 sm:p-6 pb-0">
                    <DialogTitle>Edit Order #{order.order_number}</DialogTitle>
                    <DialogDescription>
                        Modify quantity, size, variant, address, or special notes for this order.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Items
                            </h3>
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row gap-4 p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm mb-2">{item.product_name}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div>
                                                    <Label className="text-xs">Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'quantity', e.target.value)
                                                        }
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Size</Label>
                                                    <Input
                                                        value={item.size || ''}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'size', e.target.value)
                                                        }
                                                        className="h-8 text-sm"
                                                        placeholder="e.g. XL"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Color/Variant</Label>
                                                    <Input
                                                        value={item.color || ''}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'color', e.target.value)
                                                        }
                                                        className="h-8 text-sm"
                                                        placeholder="e.g. Red"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Total Price</Label>
                                                    <div className="h-8 flex items-center text-sm font-semibold">
                                                        ₹{item.total_price.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Delivery Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Address Line 1</Label>
                                    <Input
                                        value={address.line1}
                                        onChange={(e) =>
                                            setAddress({ ...address, line1: e.target.value })
                                        }
                                        placeholder="Street address, P.O. box, etc."
                                    />
                                </div>
                                <div>
                                    <Label>City</Label>
                                    <Input
                                        value={address.city}
                                        onChange={(e) =>
                                            setAddress({ ...address, city: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>State</Label>
                                    <Input
                                        value={address.state}
                                        onChange={(e) =>
                                            setAddress({ ...address, state: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label>ZIP Code</Label>
                                    <Input
                                        value={address.zip}
                                        onChange={(e) =>
                                            setAddress({ ...address, zip: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Special Notes (Optional)
                            </h3>
                            <Textarea
                                value={specialNotes}
                                onChange={(e) => setSpecialNotes(e.target.value)}
                                placeholder="Any special instructions for the customized items or delivery?"
                                className="resize-none"
                            />
                        </div>

                        <Separator />

                        <div className="bg-muted/30 p-4 rounded-lg">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Original Total:</span>
                                <span className="line-through">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>New Total:</span>
                                <span>₹{currentTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 sm:p-6 pt-2 border-t mt-auto">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
