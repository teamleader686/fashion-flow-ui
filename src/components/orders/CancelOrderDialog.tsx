import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface CancelOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comment: string) => void;
  orderNumber: string;
  loading?: boolean;
}

export default function CancelOrderDialog({
  open,
  onClose,
  onConfirm,
  orderNumber,
  loading = false,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const cancellationReasons = [
    'Ordered by mistake',
    'Found cheaper elsewhere',
    'Delivery taking too long',
    'Changed my mind',
    'Wrong product ordered',
    'Duplicate order',
    'Other',
  ];

  const handleSubmit = () => {
    if (!reason) return;
    onConfirm(reason, comment);
    setReason('');
    setComment('');
  };

  const handleClose = () => {
    setReason('');
    setComment('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Order Cancellation</DialogTitle>
          <DialogDescription>
            Order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Admin Approval Required</p>
            <p className="text-xs">
              Your cancellation request will be reviewed by our team. You'll be
              notified once it's processed.
            </p>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Cancellation <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Please provide any additional details..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
