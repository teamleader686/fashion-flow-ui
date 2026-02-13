import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface ReturnRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  orderNumber: string;
}

export default function ReturnRequestDialog({
  open,
  onClose,
  onSubmit,
  orderNumber,
}: ReturnRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const returnReasons = [
    'Product damaged or defective',
    'Wrong item received',
    'Size/fit issue',
    'Quality not as expected',
    'Changed my mind',
    'Other',
  ];

  const handleSubmit = () => {
    const fullReason = details ? `${reason} - ${details}` : reason;
    onSubmit(fullReason);
    setReason('');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Order #{orderNumber}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide more details about your return request..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason}>
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
