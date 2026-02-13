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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package, User, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  previous_order_status: string;
  created_at: string;
  order?: {
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
  };
}

interface CancellationReviewDialogProps {
  request: CancellationRequest | null;
  open: boolean;
  onClose: () => void;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

export default function CancellationReviewDialog({
  request,
  open,
  onClose,
  onApprove,
  onReject,
}: CancellationReviewDialogProps) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      await onApprove(request.id);
      setShowApproveConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;

    try {
      setLoading(true);
      await onReject(request.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
      onClose();
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Cancellation Request</DialogTitle>
            <DialogDescription>
              Carefully review the details before making a decision
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Order Information */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-lg">
                    Order #{request.order?.order_number}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {request.previous_order_status.toUpperCase()}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{request.order?.customer_name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Order Amount</p>
                  <p className="font-semibold text-lg">
                    ₹{request.order?.total_amount?.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Requested On</p>
                    <p className="font-medium">
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Details */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Cancellation Reason</Label>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">{request.reason}</p>
                </div>
              </div>

              {request.comment && (
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Additional Comments
                  </Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground italic">
                      "{request.comment}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> Approving this request will
                cancel the order and may trigger refund processing. Rejecting will restore
                the order to its previous status.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => setShowApproveConfirm(true)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Cancellation Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel order #{request.order?.order_number} and may initiate refund
              processing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Yes, Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Cancellation Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Order already shipped, Cannot process refund at this stage..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || loading}
            >
              {loading ? 'Processing...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
