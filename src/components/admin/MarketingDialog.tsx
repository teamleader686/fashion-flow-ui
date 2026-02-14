import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageCircle, Mail, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MarketingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedUsers: {
        user_id: string;
        full_name: string;
        email: string;
        phone: string;
        product_name: string;
        product_slug: string;
    }[];
}

export default function MarketingDialog({ open, onOpenChange, selectedUsers }: MarketingDialogProps) {
    const [messageType, setMessageType] = useState<'whatsapp' | 'email'>('whatsapp');
    const [template, setTemplate] = useState('Hi {user_name}, You liked {product_name}! 😍 Now get a special discount. Buy now: {product_link}');
    const [couponCode, setCouponCode] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (selectedUsers.length === 0) return;
        setSending(true);

        try {
            const logs = [];
            let successCount = 0;
            let failCount = 0;

            // Fetch coupon_id if coupon code is provided
            let couponId = null;
            if (couponCode) {
                const { data: couponData } = await supabase
                    .from('coupons')
                    .select('id')
                    .eq('code', couponCode)
                    .single();

                if (couponData) {
                    couponId = couponData.id;
                }
            }

            for (const user of selectedUsers) {
                const productLink = `${window.location.origin}/product/${user.product_slug}`;
                const personalizedMessage = template
                    .replace('{user_name}', user.full_name || 'there')
                    .replace('{product_name}', user.product_name)
                    .replace('{product_link}', productLink)
                    .replace('{coupon_code}', couponCode);

                // Prepare Log
                logs.push({
                    user_id: user.user_id,
                    product_id: (user as any).product_id,
                    message_type: messageType,
                    message: personalizedMessage,
                    coupon_id: couponId,
                    sent_at: new Date().toISOString()
                });

                if (messageType === 'whatsapp') {
                    if (user.phone) {
                        // Clean phone number
                        const cleanPhone = user.phone.replace(/\D/g, '');

                        if (cleanPhone.length >= 10) {
                            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMessage)}`;
                            window.open(waUrl, '_blank');
                            successCount++;
                        } else {
                            failCount++;
                            console.warn(`Invalid phone number for user ${user.full_name}: ${user.phone}`);
                        }
                    } else {
                        failCount++;
                        console.warn(`No phone number for user ${user.full_name}`);
                    }
                } else if (messageType === 'email' && user.email) {
                    // In a real app, this would trigger an API call to SendGrid/Resend
                    console.log(`Sending email to ${user.email}: ${personalizedMessage}`);
                    successCount++;
                }
            }

            // Save to database
            if (logs.length > 0) {
                const { error } = await supabase.from('marketing_logs').insert(logs);

                if (error) {
                    console.error('Error saving marketing logs:', error);
                    toast.error('Messages sent but failed to log activity');
                } else {
                    if (messageType === 'whatsapp') {
                        if (successCount > 0) {
                            toast.success(`${successCount} WhatsApp chat${successCount > 1 ? 's' : ''} opened successfully${failCount > 0 ? ` (${failCount} failed)` : ''}`);
                        } else {
                            toast.error('No valid phone numbers found');
                        }
                    } else {
                        toast.success(`${successCount} email${successCount > 1 ? 's' : ''} queued for sending`);
                    }
                }
            }

            onOpenChange(false);
        } catch (error: any) {
            console.error('Error sending marketing messages:', error);
            toast.error('Failed to send messages');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Targeted Marketing</DialogTitle>
                    <DialogDescription>
                        Send personalized messages to {selectedUsers.length} user(s) who wishlisted these products.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label>Message Channel</Label>
                        <RadioGroup
                            value={messageType}
                            onValueChange={(v) => setMessageType(v as any)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="whatsapp" id="whatsapp" />
                                <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
                                    <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="email" id="email" />
                                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
                                    <Mail className="h-4 w-4 text-blue-600" /> Email
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label>Coupon Code (Optional)</Label>
                        <Input
                            placeholder="e.g. SAVE20"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">Use {'{coupon_code}'} in template to auto-insert.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Message Template</Label>
                        <Textarea
                            className="min-h-[120px]"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="Write your marketing message..."
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {['{user_name}', '{product_name}', '{product_link}', '{coupon_code}'].map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-secondary/80"
                                    onClick={() => setTemplate(prev => prev + ' ' + tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sending || selectedUsers.length === 0}>
                        {sending ? 'Sending...' : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                {messageType === 'whatsapp' ? 'Open WhatsApp' : 'Send Emails'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
