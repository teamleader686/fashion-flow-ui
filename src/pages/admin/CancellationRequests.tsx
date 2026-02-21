import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CancellationReviewDialog from '@/components/admin/CancellationReviewDialog';
import { notificationService } from '@/lib/notificationService';
import { CancellationSkeleton, StatsCardsSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

interface CancellationRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  previous_order_status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  order?: {
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
  };
}

export default function CancellationRequests() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchRequests();

    let channel: any;
    try {
      // Subscribe to real-time updates securely
      channel = supabase
        .channel(`cancellation_requests_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cancellation_requests',
          },
          () => {
            console.log('Cancellation request updated');
            if (mounted) fetchRequests();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in cancellation requests:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for cancellation requests", e);
    }

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cancellation_requests')
        .select(`
          *,
          order:orders(order_number, customer_name, total_amount, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching cancellation requests:', error);
      toast.error('Failed to load cancellation requests');
    } finally {
      setLoading(false);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleApprove = async (requestId: string) => {
    try {
      const { data: adminData } = await supabase.auth.getUser();
      if (!adminData.user) throw new Error('Not authenticated');

      // Get request details for notification
      const request = requests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Optimistic update
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'approved', reviewed_by: adminData.user.id, reviewed_at: new Date().toISOString() }
          : r
      ));
      setSelectedRequest(null);
      toast.success('Cancellation request approved');

      const { error } = await supabase.rpc('approve_cancellation_request', {
        p_request_id: requestId,
        p_admin_id: adminData.user.id,
      });

      if (error) {
        // Revert on error
        setRequests(prev => prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'pending', reviewed_by: null, reviewed_at: null }
            : r
        ));
        throw error;
      }

      // Send notification in background
      notificationService.notifyCancellationApproved(
        request.order_id,
        request.user_id,
        request.order?.order_number || ''
      ).catch(console.error);

    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
      await fetchRequests(); // Fallback sync
    }
  };

  const handleReject = async (requestId: string, rejectionReason: string) => {
    try {
      const { data: adminData } = await supabase.auth.getUser();
      if (!adminData.user) throw new Error('Not authenticated');

      // Get request details for notification
      const request = requests.find((r) => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Optimistic update
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'rejected', reviewed_by: adminData.user.id, reviewed_at: new Date().toISOString(), admin_note: rejectionReason }
          : r
      ));
      setSelectedRequest(null);
      toast.success('Cancellation request rejected');

      const { error } = await supabase.rpc('reject_cancellation_request', {
        p_request_id: requestId,
        p_admin_id: adminData.user.id,
        p_admin_note: rejectionReason,
      });

      if (error) {
        // Revert on error
        setRequests(prev => prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'pending', reviewed_by: null, reviewed_at: null, admin_note: null }
            : r
        ));
        throw error;
      }

      // Send notification in background
      notificationService.notifyCancellationRejected(
        request.order_id,
        request.user_id,
        request.order?.order_number || '',
        rejectionReason
      ).catch(console.error);

    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
      await fetchRequests(); // Fallback sync
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const renderPagination = () => {
    if (filteredRequests.length <= itemsPerPage) return null;

    return (
      <div className="flex items-center justify-between px-2 py-4 border-t mt-4">
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 3 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 hidden sm:inline-flex"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <span className="sm:hidden text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cancellation Requests</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Review and manage order cancellation requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <p className="text-2xl font-bold">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <p className="text-2xl font-bold">{statusCounts.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
              <p className="text-2xl font-bold">{statusCounts.rejected}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <p className="text-2xl font-bold">{statusCounts.all}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm">
              Approved ({statusCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">
              Rejected ({statusCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({statusCounts.all})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Requests List */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-450px)]">
              {loading ? (
                <CancellationSkeleton count={5} />
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No {statusFilter !== 'all' && statusFilter} cancellation requests
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 sm:p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              Order #{request.order?.order_number}
                            </span>
                            <Badge
                              className={
                                request.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : request.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                              }
                            >
                              {request.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            <span>{request.order?.customer_name}</span>
                            <span>•</span>
                            <span>₹{request.order?.total_amount?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium mb-1">Reason: {request.reason}</p>
                            {request.comment && (
                              <p className="text-muted-foreground text-xs">
                                "{request.comment}"
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Requested {format(new Date(request.created_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                      {request.admin_note && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm mt-3">
                          <p className="font-medium text-red-800 mb-1">Admin Note:</p>
                          <p className="text-red-600">{request.admin_note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Pagination Controls */}
                  {renderPagination()}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <CancellationReviewDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </AdminLayout>
  );
}
