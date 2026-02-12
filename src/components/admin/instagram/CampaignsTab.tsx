import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useInstagramCampaigns } from '@/hooks/useInstagramMarketing';
import CampaignDialog from './CampaignDialog';
import CampaignCard from './CampaignCard';

export default function CampaignsTab() {
  const { campaigns, loading } = useInstagramCampaigns();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading campaigns...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {campaigns.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          No campaigns created yet
        </div>
      )}

      <CampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
