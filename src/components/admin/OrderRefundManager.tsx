import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OrderRefundManagerProps {
    order: any;
    onUpdate?: () => void;
}

export default function OrderRefundManager({ order, onUpdate }: OrderRefundManagerProps) {
    const [loading, setLoading] = useState(false);
    const [refundAmount, setRefundAmount] = useState(order.total_amount?.toString() || '0');
    const [penaltyPercent, setPenaltyPercent] = useState('20');
    const [adminNote, setAdminNote] = useState('');
    const [openConfirm, setOpenConfirm] = useState(false);

    // Only show for delivered or returned orders
    if (!['delivered', 'returned', 'cancellation_requested'].includes(order.status) && order.payment_status !== 'paid') {
        return null;
    }

    const handleProcessRefund = async () => {
        if (!renderingDetails) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('process_return_refund', {
                p_order_id: order.id,
                p_user_id: order.user_id,
                p_return_amount: parseFloat(refundAmount),
                p_penalty_percent: parseFloat(penaltyPercent),
                p_admin_note: adminNote
            });

            if (error) throw error;

            console.log("Refund Response:", data);

            if (data && data.success) {
                toast.success(`Refund processed! Coins reversed: ${data.coins_reversed}, Penalty: ${data.penalty_coins}`);
                // Also update order status to 'returned' if not already
                if (order.status !== 'returned') {
                    await supabase.from('orders').update({ status: 'returned', payment_status: 'refunded' }).eq('id', order.id);
                }
                if (onUpdate) onUpdate();
                setOpenConfirm(false);
            } else {
                toast.error('Failed to process refund: ' + (data?.error || 'Unknown error'));
            }

        } catch (error: any) {
            console.error('Refund Error:', error);
            toast.error(error.message || 'Failed to process refund');
        } finally {
            setLoading(false);
        }
    };

    const renderingDetails = order.status === 'delivered' || order.status === 'returned';

    return (
        <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                    <RefreshCcw className="w-5 h-5" />
                    Refund & Returns
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!openConfirm ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Order Status:</span>
                            <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Payment:</span>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {order.payment_status}
                            </Badge>
                        </div>

                        <Button
                            onClick={() => setOpenConfirm(true)}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            disabled={order.status === 'returned' && order.payment_status === 'refunded'}
                        >
                            {order.status === 'returned' && order.payment_status === 'refunded'
                                ? 'Refund Already Processed'
                                : 'Process Return & Refund'
                            }
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-white p-4 rounded-md border text-sm space-y-3">
                            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                <p className="text-xs">
                                    Action: <b>Reverse Earned Coins</b> + <b>Deduct Penalty</b> + <b>Refund to Wallet</b>.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="refundAmount">Refund Amount (₹)</Label>
                                <Input
                                    id="refundAmount"
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="penalty">Penalty Percentage (%)</Label>
                                <Input
                                    id="penalty"
                                    type="number"
                                    value={penaltyPercent}
                                    onChange={(e) => setPenaltyPercent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Typically 20% to prevent misuse.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Admin Note</Label>
                                <Input
                                    id="note"
                                    placeholder="Reason for return/refund..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => setOpenConfirm(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleProcessRefund}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Refund'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
