import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: 'active' | 'inactive';
  display_order: number;
}

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
  display_order: number;
}

export default function CategoryDialog({
  open,
  onClose,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      status: 'active',
      display_order: 0,
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        status: category.status,
        display_order: category.display_order,
      });
      setImagePreview(category.image_url);
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
        status: 'active',
        display_order: 0,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [category, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [nameValue, category, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('category-images').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      let imageUrl = category?.image_url || null;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (!imagePreview) {
        imageUrl = null;
      }

      const categoryData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image_url: imageUrl,
        status: data.status,
        display_order: data.display_order,
      };

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;

        toast.success('Category updated successfully');
      } else {
        // Create new category
        const { error } = await supabase.from('categories').insert(categoryData);

        if (error) throw error;

        toast.success('Category created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        toast.error('A category with this name or slug already exists');
      } else {
        toast.error(error.message || 'Failed to save category');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with proper padding - extra right padding for close button */}
        <DialogHeader className="pl-6 pr-14 pt-6 pb-4 space-y-2">
          <DialogTitle className="text-2xl font-semibold">
            {category ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {category
              ? 'Update category details and settings'
              : 'Add a new category for organizing products'}
          </DialogDescription>
        </DialogHeader>

        {/* Form with proper padding - equal on all sides, extra right for close button */}
        <form onSubmit={handleSubmit(onSubmit)} className="pl-6 pr-6 pb-6 space-y-6">
          {/* Name */}
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Category name is required' })}
              placeholder="e.g., Kurtis, Dresses, Sarees"
              className="h-11 text-base"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1.5">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2.5">
            <Label htmlFor="slug" className="text-sm font-medium">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              {...register('slug', { required: 'Slug is required' })}
              placeholder="e.g., kurtis, dresses, sarees"
              className="font-mono text-sm h-11"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              URL-friendly version (auto-generated from name)
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive mt-1.5">{errors.slug.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this category"
              rows={3}
              className="text-base resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Category Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative w-full sm:w-40 h-40 rounded-xl overflow-hidden border-2 border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3 font-medium">
                  Click to upload category image
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="max-w-full sm:max-w-xs mx-auto cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Status and Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={watch('status')}
                onValueChange={(value: 'active' | 'inactive') =>
                  setValue('status', value)
                }
              >
                <SelectTrigger id="status" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="display_order" className="text-sm font-medium">
                Display Order
              </Label>
              <Input
                id="display_order"
                type="number"
                {...register('display_order', { valueAsNumber: true })}
                placeholder="0"
                className="h-11 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Lower numbers appear first
              </p>
            </div>
          </div>

          {/* Footer with proper spacing */}
          <DialogFooter className="pt-4 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-11 px-6 text-base w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-6 text-base w-full sm:w-auto"
            >
              {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
