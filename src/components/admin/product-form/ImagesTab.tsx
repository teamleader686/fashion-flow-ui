import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import StorageAlertBanner from '@/components/admin/storage/StorageAlertBanner';
import storageLogger from '@/lib/storageLogger';

type ImagesTabProps = {
  productId?: string;
  images: any[];
  setImages: (images: any[]) => void;
};

const ImagesTab = ({ productId, images, setImages }: ImagesTabProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Update progress
        const progressPercent = Math.round(((i + 0.5) / totalFiles) * 100);
        setUploadProgress(progressPercent);

        const { error: uploadError, data } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Log file upload to storage tracker
        storageLogger.logFileUpload(
          'product_images',
          'product-images',
          filePath,
          storageLogger.getFileSizeKB(file)
        );

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedImages.push({
          image_url: publicUrl,
          is_primary: images.length === 0 && i === 0,
          display_order: images.length + i,
        });

        // Update progress after each file
        const finalProgress = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(finalProgress);
      }

      setImages([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);

      // Better error messages
      if (error.message?.includes('Bucket not found')) {
        toast.error('Storage bucket not configured. Please contact administrator.');
      } else if (error.message?.includes('File size')) {
        toast.error('File size too large. Maximum 10MB per image.');
      } else if (error.message?.includes('mime')) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.');
      } else {
        toast.error('Failed to upload images. Please try again.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];

    // Optimistically update UI
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // If it's a supabase storage URL, try to delete it
    if (imageToRemove?.image_url?.includes('product-images')) {
      try {
        // Extract file path from URL
        const matches = imageToRemove.image_url.match(/product-images\/(.*)/);
        if (matches && matches[1]) {
          const filePath = matches[1];
          await supabase.storage
            .from('product-images')
            .remove([filePath]);

          // Log deletion
          storageLogger.logFileDelete('product_images', 'product-images', filePath, 0);
        }
      } catch (error) {
        console.error('Failed to cleanup image from storage', error);
      }
    }
  };

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(newImages);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
            <p className="text-sm text-muted-foreground">
              Upload clear, high-quality images. The first image will be the primary cover.
            </p>
          </div>
          <StorageAlertBanner compact className="w-auto" />
        </div>

        <div className="group relative border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer bg-gray-50/50">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id="image-upload"
          />
          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            {uploading ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-full opacity-50 blur p-2"></div>
                  <Loader2 className="h-12 w-12 text-purple-600 animate-spin relative z-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700">Uploading {uploadProgress}%</p>
                  <Progress value={uploadProgress} className="w-48 h-1.5" />
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-white rounded-full shadow-sm ring-1 ring-gray-200 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-gray-900">Click or drag images here to upload</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG, WebP (Max 10MB)</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-gray-900">Gallery ({images.length})</Label>
            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">Drag to reorder (Coming soon)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div key={index} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={image.image_url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      type="button"
                      title="Delete Image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full bg-white/90 hover:bg-white text-xs h-8"
                        onClick={() => setPrimaryImage(index)}
                        type="button"
                      >
                        Set as Cover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-purple-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </div>
                )}
                {!image.is_primary && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono opacity-60">
                    {index + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagesTab;
