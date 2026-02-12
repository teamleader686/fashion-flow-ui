import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramCoinLogs, useInstagramUsers } from '@/hooks/useInstagramMarketing';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssignCoinsDialog({ open, onOpenChange }: Props) {
  const { assignCoins } = useInstagramCoinLogs();
  const { users } = useInstagramUsers();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await assignCoins({
        user_id: data.user_id,
        coins: parseInt(data.coins),
        reason: data.reason
      });
      toast({ title: 'Success', description: 'Coins assigned successfully' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Coins</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="user_id">Select Instagram User *</Label>
            <Select onValueChange={(value) => setValue('user_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose user" />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.status === 'active').map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} (@{user.instagram_username}) - {user.total_coins} coins
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.user_id && <p className="text-sm text-red-500 mt-1">User is required</p>}
          </div>

          <div>
            <Label htmlFor="coins">Coins Amount *</Label>
            <Input
              id="coins"
              type="number"
              {...register('coins', { required: 'Coins amount is required', min: 1 })}
              placeholder="Enter coins amount"
            />
            {errors.coins && <p className="text-sm text-red-500 mt-1">{errors.coins.message as string}</p>}
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              {...register('reason', { required: 'Reason is required' })}
              placeholder="e.g., Story Completed, Campaign Bonus"
              rows={3}
            />
            {errors.reason && <p className="text-sm text-red-500 mt-1">{errors.reason.message as string}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign Coins'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
