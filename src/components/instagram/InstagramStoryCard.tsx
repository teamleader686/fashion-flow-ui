import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, Clock } from 'lucide-react';
import type { InstagramAssignment } from '@/types/instagram';
import { useEffect, useState } from 'react';

interface Props {
  assignment: InstagramAssignment;
}

export default function InstagramStoryCard({ assignment }: Props) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(assignment.expiry_date);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [assignment.expiry_date]);

  const handleDownload = async () => {
    if (!assignment.campaign?.media_url) return;

    try {
      const response = await fetch(assignment.campaign.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.campaign.campaign_title}.${assignment.campaign.media_type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const openInstagram = () => {
    window.open('https://instagram.com', '_blank');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold">{assignment.campaign?.campaign_title}</h3>
          <Badge variant={timeRemaining === 'Expired' ? 'destructive' : 'default'}>
            {assignment.status}
          </Badge>
        </div>

        {assignment.campaign?.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {assignment.campaign.description}
          </p>
        )}

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

        <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 rounded-lg">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">
            {timeRemaining}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
            onClick={openInstagram}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Post Story
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
