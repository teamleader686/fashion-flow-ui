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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-semibold">Assign Coins</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="user_id" className="text-sm font-medium">
              Select Instagram User <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(value) => setValue('user_id', value, { shouldValidate: true })}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={users.length > 0 ? "Choose user" : "No users found"} />
              </SelectTrigger>
              <SelectContent>
                {users && users.length > 0 ? (
                  users.filter(u => u.status === 'active').map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} (@{user.instagram_username}) - {user.total_coins || 0} coins
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">No active users found</div>
                )}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              {...register('user_id', { required: 'Please select a user' })}
            />
            {errors.user_id && (
              <p className="text-sm text-red-500 mt-1.5">{errors.user_id.message as string}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="coins" className="text-sm font-medium">
              Coins Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="coins"
              type="number"
              {...register('coins', { required: 'Coins amount is required', min: 1 })}
              placeholder="Enter coins amount"
              className="h-11 text-base"
            />
            {errors.coins && (
              <p className="text-sm text-red-500 mt-1.5">
                {errors.coins.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason', { required: 'Reason is required' })}
              placeholder="e.g., Story Completed, Campaign Bonus"
              rows={3}
              className="text-base resize-none"
            />
            {errors.reason && (
              <p className="text-sm text-red-500 mt-1.5">
                {errors.reason.message as string}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 text-base w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 text-base w-full sm:w-auto"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Coins'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
