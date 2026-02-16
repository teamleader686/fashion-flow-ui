import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCampaigns, useInstagramUsers } from '@/hooks/useInstagramMarketing';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CampaignDialog({ open, onOpenChange }: Props) {
  const { createCampaign } = useInstagramCampaigns();
  const { users } = useInstagramUsers();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');

  const mediaType = watch('media_type', 'image');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const onSubmit = async (data: any) => {
    if (!mediaFile) {
      toast({ title: 'Error', description: 'Please upload media file', variant: 'destructive' });
      return;
    }

    try {
      await createCampaign({
        ...data,
        media_file: mediaFile,
        assigned_users: selectedUsers
      });
      toast({ title: 'Success', description: 'Campaign created successfully' });
      onOpenChange(false);
      setMediaFile(null);
      setMediaPreview('');
      setSelectedUsers([]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaign_title">Campaign Title *</Label>
              <Input
                id="campaign_title"
                {...register('campaign_title', { required: 'Title is required' })}
                placeholder="Enter campaign title"
              />
              {errors.campaign_title && <p className="text-sm text-red-500 mt-1">{errors.campaign_title.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="campaign_code">Campaign Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="campaign_code"
                  {...register('campaign_code', { required: 'Code is required' })}
                  placeholder="e.g. INSTA-SUMMER"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const code = 'INST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                    setValue('campaign_code', code);
                  }}
                >
                  Regen
                </Button>
              </div>
              {errors.campaign_code && <p className="text-sm text-red-500 mt-1">{errors.campaign_code.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                {...register('source')}
                defaultValue="instagram"
                placeholder="instagram"
              />
            </div>

            <div>
              <Label htmlFor="medium">Medium</Label>
              <Input
                id="medium"
                {...register('medium')}
                placeholder="story, bio, ads"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter campaign description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="media_type">Media Type *</Label>
              <Select
                defaultValue="image"
                onValueChange={(value) => setValue('media_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiry_hours">Expiry Hours *</Label>
              <Input
                id="expiry_hours"
                type="number"
                {...register('expiry_hours', { required: true, min: 1 })}
                defaultValue={24}
                placeholder="24"
              />
            </div>
          </div>

          <div>
            <Label>Upload Media *</Label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                {mediaPreview ? (
                  <div className="space-y-2">
                    {mediaType === 'image' ? (
                      <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    ) : (
                      <video src={mediaPreview} className="max-h-48 mx-auto rounded" controls />
                    )}
                    <Button type="button" variant="outline" size="sm">Change File</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload {mediaType}</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <Label>Assign to Instagram Users</Label>
            <div className="mt-2 border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {users.filter(u => u.status === 'active').map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={user.id}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  <label htmlFor={user.id} className="text-sm cursor-pointer flex-1">
                    {user.name} (@{user.instagram_username})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
