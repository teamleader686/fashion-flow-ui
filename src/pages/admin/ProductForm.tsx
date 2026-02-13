import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import BasicInfoTab from '@/components/admin/product-form/BasicInfoTab';
import ImagesTab from '@/components/admin/product-form/ImagesTab';
import VariantsTab from '@/components/admin/product-form/VariantsTab';
import LoyaltyTab from '@/components/admin/product-form/LoyaltyTab';
import AffiliateTab from '@/components/admin/product-form/AffiliateTab';
import OfferTab from '@/components/admin/product-form/OfferTab';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    compare_at_price: 0,
    category_id: '',
    sku: '',
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_active: true,
    is_featured: false,
    available_sizes: [] as string[],
    available_colors: [] as { name: string; hex: string }[],
  });

  const [images, setImages] = useState<any[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    is_enabled: true,
    coins_earned_per_purchase: 10,
    coins_required_for_redemption: 100,
    max_coins_usable_per_order: 500,
  });
  const [affiliateConfig, setAffiliateConfig] = useState({
    is_enabled: false,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 0,
  });
  const [offer, setOffer] = useState({
    is_enabled: false,
    offer_type: 'percentage_discount' as 'percentage_discount' | 'flat_discount' | 'bogo',
    discount_value: 0,
    start_date: '',
    end_date: '',
    banner_tag: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images(*),
          loyalty_config:product_loyalty_config(*),
          affiliate_config:product_affiliate_config(*),
          offers:product_offers(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData(data);
      setImages(data.product_images || []);
      if (data.loyalty_config?.[0]) setLoyaltyConfig(data.loyalty_config[0]);
      if (data.affiliate_config?.[0]) setAffiliateConfig(data.affiliate_config[0]);
      if (data.offers?.[0]) {
        setOffer({
          is_enabled: true,
          ...data.offers[0]
        });
      }
    } catch (error: any) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!formData.name || !formData.price) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Generate slug if not provided
      if (!formData.slug) {
        formData.slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      }

      let productId = id;

      // Insert or update product
      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Save loyalty config
      await supabase
        .from('product_loyalty_config')
        .upsert({
          product_id: productId,
          ...loyaltyConfig
        });

      // Save product images
      if (images.length > 0) {
        // Delete existing images if editing
        if (isEdit) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId);
        }

        // Insert new images
        const imageRecords = images.map((img, index) => ({
          product_id: productId,
          image_url: img.image_url,
          is_primary: img.is_primary || index === 0,
          display_order: img.display_order || index,
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageRecords);

        if (imagesError) {
          console.error('Error saving images:', imagesError);
          toast.error('Product saved but images failed to save');
        }
      }

      // Save affiliate config
      await supabase
        .from('product_affiliate_config')
        .upsert({
          product_id: productId,
          ...affiliateConfig
        });

      // Save offer if enabled
      if (offer.is_enabled && offer.start_date && offer.end_date) {
        await supabase
          .from('product_offers')
          .upsert({
            product_id: productId,
            offer_type: offer.offer_type,
            discount_value: offer.discount_value,
            start_date: offer.start_date,
            end_date: offer.end_date,
            banner_tag: offer.banner_tag,
            is_active: true
          });
      }

      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-500">Loading product...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/products')}
              className="shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {isEdit ? 'Update product details' : 'Create a new product'}
              </p>
            </div>
          </div>
          
          {/* Desktop Save Button */}
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="hidden sm:flex bg-gradient-to-r from-pink-500 to-purple-600 shrink-0"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>

        {/* Form Tabs */}
        <Card>
          <CardContent className="p-3 sm:p-6">
            <Tabs defaultValue="basic" className="w-full">
              {/* Responsive Tabs List */}
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
                <TabsTrigger value="basic" className="text-xs sm:text-sm py-2">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs sm:text-sm py-2">
                  Images
                </TabsTrigger>
                <TabsTrigger value="variants" className="text-xs sm:text-sm py-2">
                  Variants
                </TabsTrigger>
                <TabsTrigger value="loyalty" className="text-xs sm:text-sm py-2">
                  Loyalty
                </TabsTrigger>
                <TabsTrigger value="affiliate" className="text-xs sm:text-sm py-2">
                  Affiliate
                </TabsTrigger>
                <TabsTrigger value="offer" className="text-xs sm:text-sm py-2 col-span-2 sm:col-span-1">
                  Offers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-4 sm:mt-6">
                <BasicInfoTab
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="images" className="mt-4 sm:mt-6">
                <ImagesTab
                  productId={id}
                  images={images}
                  setImages={setImages}
                />
              </TabsContent>

              <TabsContent value="variants" className="mt-4 sm:mt-6">
                <VariantsTab
                  sizes={formData.available_sizes}
                  colors={formData.available_colors}
                  onSizesChange={(sizes) => setFormData({ ...formData, available_sizes: sizes })}
                  onColorsChange={(colors) => setFormData({ ...formData, available_colors: colors })}
                />
              </TabsContent>

              <TabsContent value="loyalty" className="mt-4 sm:mt-6">
                <LoyaltyTab
                  config={loyaltyConfig}
                  setConfig={setLoyaltyConfig}
                />
              </TabsContent>

              <TabsContent value="affiliate" className="mt-4 sm:mt-6">
                <AffiliateTab
                  config={affiliateConfig}
                  setConfig={setAffiliateConfig}
                />
              </TabsContent>

              <TabsContent value="offer" className="mt-4 sm:mt-6">
                <OfferTab
                  offer={offer}
                  setOffer={setOffer}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Mobile Floating Save Button */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 h-12 text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
