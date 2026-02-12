import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileImage, Video } from 'lucide-react';
import type { InstagramCampaign } from '@/types/instagram';

interface Props {
  campaign: InstagramCampaign;
}

export default function CampaignCard({ campaign }: Props) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {campaign.media_type === 'image' ? (
              <FileImage className="w-5 h-5 text-blue-600" />
            ) : (
              <Video className="w-5 h-5 text-purple-600" />
            )}
            <h3 className="font-semibold">{campaign.campaign_title}</h3>
          </div>
          <Badge variant={
            campaign.status === 'active' ? 'default' :
            campaign.status === 'completed' ? 'secondary' : 'destructive'
          }>
            {campaign.status}
          </Badge>
        </div>

        {campaign.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {campaign.description}
          </p>
        )}

        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
          {campaign.media_type === 'image' ? (
            <img
              src={campaign.media_url}
              alt={campaign.campaign_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={campaign.media_url}
              className="w-full h-full object-cover"
              controls
            />
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Created: {new Date(campaign.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
