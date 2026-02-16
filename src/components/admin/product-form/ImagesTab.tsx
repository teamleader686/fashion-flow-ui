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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(newImages);
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <Label>Product Images</Label>
        <p className="text-sm text-gray-500 mb-4">
          Upload product images. First image will be the primary image. Max 10MB per image.
        </p>

        {/* Storage warning */}
        <StorageAlertBanner compact className="mb-4" />

        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-sm text-gray-600 font-medium">
                  Uploading images... {uploadProgress}%
                </p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto mt-3" />
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF, WebP up to 10MB
                </p>
              </>
            )}
          </label>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <Label className="mb-3 block">Uploaded Images ({images.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.image_url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => setPrimaryImage(index)}
                    title="Set as primary"
                    type="button"
                  >
                    <Star
                      className={`h-4 w-4 ${image.is_primary ? 'fill-yellow-400 text-yellow-400' : ''
                        }`}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded font-medium">
                    Primary
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagesTab;
