import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Star, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
  product?: { name: string };
  user_profile?: { full_name: string; email: string };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately
      const reviewsWithRelations = await Promise.all(
        (data || []).map(async (review) => {
          // Fetch product
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', review.product_id)
            .single();

          // Fetch user profile
          let userProfile = null;
          if (review.user_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('full_name, email')
              .eq('user_id', review.user_id)
              .single();
            userProfile = profile;
          }

          return {
            ...review,
            product,
            user_profile: userProfile
          };
        })
      );

      setReviews(reviewsWithRelations);
    } catch (error) {
      console.error('Error fetching reviews:', error);
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
      toast.success('Review approved');
      fetchReviews();
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(
    (r) =>
      r.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage product reviews and ratings</p>
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
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500" />
                {stats.avgRating}
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{review.user_profile?.full_name || 'Anonymous'}</span>
                        <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                          {review.is_approved ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pending</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          for <span className="font-medium">{review.product?.name || 'Unknown Product'}</span>
                        </span>
                      </div>
                      <p className="text-sm">{review.review_text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {!review.is_approved && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(review.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleReject(review.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
