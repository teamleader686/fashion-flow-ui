import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileImage, Clock, CheckCircle } from 'lucide-react';
import InstagramStoryCard from '@/components/instagram/InstagramStoryCard';
import CoinHistoryCard from '@/components/instagram/CoinHistoryCard';
import InstagramLayout from '@/components/instagram/InstagramLayout';
import { useInstagramAssignments, useInstagramCoinLogs } from '@/hooks/useInstagramMarketing';
import type { InstagramUser } from '@/lib/supabase';

export default function InstagramDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<InstagramUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { assignments } = useInstagramAssignments();
  const { coinLogs } = useInstagramCoinLogs();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/instagram-login');
        return;
      }

      const { data: instagramUser, error } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !instagramUser) {
        navigate('/instagram-login');
        return;
      }

      if (instagramUser.status !== 'active') {
        await supabase.auth.signOut();
        navigate('/instagram-login');
        return;
      }

      setUser(instagramUser);
    } catch (error) {
      navigate('/instagram-login');
    } finally {
      setLoading(false);
    }
  };

  const activeStories = assignments.filter(a => a.status === 'active');
  const expiredStories = assignments.filter(a => a.status === 'expired');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null;

  return (
    <InstagramLayout user={user}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
                <Award className="w-5 h-5" />
                {user.total_coins_earned || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                {activeStories.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {expiredStories.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {assignments.filter(a => a.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Stories */}
        <Card>
          <CardHeader>
            <CardTitle>Active Stories</CardTitle>
          </CardHeader>
          <CardContent>
            {activeStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeStories.map((assignment) => (
                  <InstagramStoryCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active stories assigned
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coin History */}
        <CoinHistoryCard userId={user.id} />
      </div>
    </InstagramLayout>
  );
}
