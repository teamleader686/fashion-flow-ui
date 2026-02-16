import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Star, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  comment: string; // Handle both fields if schema varies
  is_approved: boolean;
  created_at: string;
  expires_at?: string; // Add expires_at to the interface
  product?: { name: string };
  user_profile?: { full_name: string; email: string };
  users?: { full_name: string }; // For joins
}

// Helper to format remaining time
const getRemainingTime = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
};

const ReviewItem = ({ review, onApprove, onReject }: { review: Review, onApprove: (id: string) => void, onReject: (id: string) => void }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-lg">{review.user_profile?.full_name || 'Anonymous'}</span>
            <Badge variant={review.is_approved ? 'default' : 'secondary'} className={!review.is_approved ? "bg-orange-100 text-orange-700 hover:bg-orange-100" : "bg-green-100 text-green-700 hover:bg-green-100"}>
              {review.is_approved ? (
                <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</div>
              ) : (
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending Approval</div>
              )}
            </Badge>
            {/* Show expiry timer for pending reviews */}
            {!review.is_approved && review.expires_at && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Expires in: {getRemainingTime(review.expires_at)}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto md:ml-0">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              for <span className="font-medium text-foreground">{review.product?.name || 'Unknown Product'}</span>
            </span>
          </div>

          <div className="bg-muted/30 p-3 rounded-md text-sm leading-relaxed">
            "{review.review_text}"
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 min-w-[120px]">
          {!review.is_approved ? (
            <>
              <Button size="sm" onClick={() => onApprove(review.id)} className="bg-green-600 hover:bg-green-700 w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(review.id)} className="text-destructive hover:bg-destructive/10 w-full">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onReject(review.id)} className="text-destructive hover:bg-destructive/10 w-full">
              <XCircle className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

function EmptyState({ type = 'all' }: { type?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
      <div className="bg-muted p-4 rounded-full mb-3">
        <Star className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold">No reviews found</h3>
      <p className="text-sm text-muted-foreground max-w-sm text-center">
        {type === 'pending' ? 'Great job! You have handled all pending reviews.' :
          type === 'approved' ? 'No approved reviews yet.' :
            'No reviews match your criteria.'}
      </p>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchReviews();
    cleanupExpired(); // Try cleanup on load
  }, []);

  const cleanupExpired = async () => {
    try {
      await supabase.rpc('cleanup_expired_reviews');
    } catch (e) {
      console.log('Cleanup trigger failed (optional):', e);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews with relations
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          product:products(name),
          user_profile:user_profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Normalize data structure
      const formatted = (data || []).map((r: any) => ({
        ...r,
        review_text: r.comment || r.review_text, // Handle dynamic naming
        user_profile: r.user_profile || { full_name: 'Unknown User', email: '' }
      }));

      setReviews(formatted);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;

      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
      toast.success('Review approved');
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.review_text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user_profile?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'approved') return matchesSearch && r.is_approved;
    if (activeTab === 'pending') return matchesSearch && !r.is_approved;
    return matchesSearch;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter((r) => r.is_approved).length,
    pending: reviews.filter((r) => !r.is_approved).length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Reviews Management</h1>
            <p className="text-muted-foreground mt-1">Monitor and moderate customer feedback</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { cleanupExpired(); fetchReviews(); }} disabled={loading}>
              Run Cleanup & Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Live</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Action</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500" />
                {stats.avgRating}
              </div>
              <div className="text-sm text-muted-foreground">Avg Store Rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, product, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {stats.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            ) : <EmptyState />}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            ) : <EmptyState type="pending" />}
          </TabsContent>

          <TabsContent value="approved" className="mt-4 space-y-4">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            ) : <EmptyState type="approved" />}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
