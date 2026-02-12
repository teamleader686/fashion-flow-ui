import { useInstagramAssignments } from '@/hooks/useInstagramMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AssignmentsTab() {
  const { assignments, loading } = useInstagramAssignments();

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const openInstagram = (username: string) => {
    window.open(`https://instagram.com/${username.replace('@', '')}`, '_blank');
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{assignment.campaign?.campaign_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    @{assignment.user?.instagram_username}
                  </p>
                </div>
                <Badge variant={
                  assignment.status === 'active' ? 'default' :
                  assignment.status === 'completed' ? 'secondary' : 'destructive'
                }>
                  {assignment.status}
                </Badge>
              </div>

              {assignment.campaign?.media_url && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {assignment.campaign.media_type === 'image' ? (
                    <img
                      src={assignment.campaign.media_url}
                      alt={assignment.campaign.campaign_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={assignment.campaign.media_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                </div>
              )}

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeRemaining(assignment.expiry_date)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Assigned: {formatDistanceToNow(new Date(assignment.assigned_date), { addSuffix: true })}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => openInstagram(assignment.user?.instagram_username || '')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Instagram
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No assignments found
        </div>
      )}
    </div>
  );
}
