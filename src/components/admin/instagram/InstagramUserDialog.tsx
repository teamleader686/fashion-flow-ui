import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstagramUsers } from '@/hooks/useInstagramMarketing';
import { useToast } from '@/hooks/use-toast';
import type { InstagramUserFormData } from '@/types/instagram';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

export default function InstagramUserDialog({ open, onOpenChange, user }: Props) {
  const { addUser, updateUser } = useInstagramUsers();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<InstagramUserFormData>();

  useEffect(() => {
    if (user) {
      reset(user);
    } else {
      reset({
        name: '',
        mobile_number: '',
        email: '',
        password: '',
        instagram_username: '',
        followers_count: 1000,
        status: 'active'
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: InstagramUserFormData) => {
    try {
      if (user) {
        await updateUser(user.id, data);
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        await addUser(data);
        toast({ title: 'Success', description: 'User added successfully' });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit' : 'Add'} Instagram User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                {...register('mobile_number', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Mobile number must be exactly 10 digits'
                  }
                })}
                placeholder="e.g. 9876543210"
                maxLength={10}
              />
              {errors.mobile_number && <p className="text-sm text-red-500 mt-1">{errors.mobile_number.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="Enter email"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password {!user && '*'}</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: !user ? 'Password is required' : false })}
                placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="instagram_username">Instagram Username *</Label>
              <Input
                id="instagram_username"
                {...register('instagram_username', { required: 'Instagram username is required' })}
                placeholder="@username"
              />
              {errors.instagram_username && <p className="text-sm text-red-500 mt-1">{errors.instagram_username.message}</p>}
            </div>

            <div>
              <Label htmlFor="followers_count">Followers Count *</Label>
              <Input
                id="followers_count"
                type="number"
                {...register('followers_count', {
                  required: 'Followers count is required',
                  min: { value: 1000, message: 'Minimum 1000 followers required' }
                })}
                placeholder="Minimum 1000"
              />
              {errors.followers_count && <p className="text-sm text-red-500 mt-1">{errors.followers_count.message}</p>}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={user?.status || 'active'}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : user ? 'Update' : 'Add'} User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
