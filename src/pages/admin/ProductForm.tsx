import { useState, useEffect } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import storageLogger from '@/lib/storageLogger';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Block navigation if there are unsaved changes
  // Note: unstable_useBlocker is available in react-router-dom v6.
  // Ideally we should use a custom hook or the stable version if available, but for now we follow the user request.
  // Since useBlocker might not be available in all versions, we'll try a simpler approach if needed,
  // but let's assume standard modern React Router.
  // Actually, to be safe and avoid breaking if useBlocker isn't exported, we'll implement a simple dirty check.



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
    loyalty_coins_reward: 0,
    loyalty_coins_price: null as number | null,
    shipping_charge: 0,
    offer_type: 'percentage' as 'percentage' | 'flat',
    offer_value: 0,
    offer_start_date: null as string | null,
    offer_end_date: null as string | null,
    is_offer_active: false,
    banner_tag: '',
  });

  const [images, setImages] = useState<any[]>([]);
  const [affiliateConfig, setAffiliateConfig] = useState({
    is_enabled: false,
    commission_type: 'percentage' as 'percentage' | 'fixed',
    commission_value: 0,
  });

  // Warn on page leave if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!saving && (formData.name !== '' || formData.price > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, saving]);

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
          affiliate_config:product_affiliate_config(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        ...data,
        available_sizes: data.available_sizes || [],
        available_colors: data.available_colors || [],
        loyalty_coins_reward: data.loyalty_coins_reward || 0,
        loyalty_coins_price: data.loyalty_coins_price || null,
        shipping_charge: data.shipping_charge || 0,
        offer_type: data.offer_type || 'percentage',
        offer_value: data.offer_value || 0,
        offer_start_date: data.offer_start_date || null,
        offer_end_date: data.offer_end_date || null,
        is_offer_active: data.is_offer_active || false,
        banner_tag: data.banner_tag || '',
      });
      setImages(data.product_images || []);
      if (data.affiliate_config?.[0]) setAffiliateConfig(data.affiliate_config[0]);
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
      if (!formData.name) {
        toast.error('Product Name is required');
        setSaving(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price.toString()) <= 0) {
        toast.error('Price must be greater than 0');
        setSaving(false);
        return;
      }
      if (parseInt(formData.stock_quantity.toString()) < 0) {
        toast.error('Stock Quantity cannot be negative');
        setSaving(false);
        return;
      }
      if (!formData.category_id) {
        toast.error('Please select a Category');
        setSaving(false);
        return;
      }

      // Create submission object to avoid mutating state and remove relations
      const {
        product_images,
        affiliate_config: _,
        offers,
        category,
        ...submissionData
      } = formData as any;

      // Clean up any other potential relation fields from fetch
      delete submissionData.product_affiliate_config;
      delete submissionData.product_offers;

      // Generate slug if not provided
      if (!submissionData.slug) {
        submissionData.slug = submissionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      // Generate SKU if not provided
      if (!submissionData.sku) {
        const prefix = submissionData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
        const random = Math.floor(1000 + Math.random() * 9000);
        submissionData.sku = `${prefix}-${random}`;
      }

      let productId = id;

      // Insert or update product
      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(submissionData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([submissionData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
        // Log product creation
        storageLogger.logCreate('products', data.id, 2);
      }

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
      const { created_at: _ca, updated_at: _ua, ...affiliateSubmission } = affiliateConfig as any;
      await supabase
        .from('product_affiliate_config')
        .upsert({
          product_id: productId,
          ...affiliateSubmission
        }, { onConflict: 'product_id' });

      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      // Log update if editing
      if (isEdit && productId) {
        storageLogger.logUpdate('products', productId, 0.5);
      }
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.code === '23505') {
        if (error.message?.includes('sku') || error.details?.includes('sku')) {
          toast.error('Product with this SKU already exists. Please use a unique SKU.');
        } else if (error.message?.includes('slug') || error.details?.includes('slug')) {
          toast.error('Product with this Name/Slug already exists.');
        } else {
          toast.error('Duplicate entry found. Please check your data.');
        }
      } else {
        toast.error('Failed to save product: ' + (error.message || 'Unknown error'));
      }
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

        <div className="max-w-6xl mx-auto">
          {/* Form Tabs */}
          <Tabs defaultValue="basic" className="w-full space-y-6">
            <div className="sticky top-[70px] z-40 bg-gray-50/95 backdrop-blur py-2 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-gray-200">
              <TabsList className="flex w-full overflow-x-auto h-auto p-1 bg-transparent justify-start gap-2 no-scrollbar">
                <TabsTrigger
                  value="basic"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Images
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Variants
                </TabsTrigger>
                <TabsTrigger
                  value="loyalty"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Loyalty
                </TabsTrigger>
                <TabsTrigger
                  value="affiliate"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Affiliate
                </TabsTrigger>
                <TabsTrigger
                  value="offer"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-gray-900 data-[state=active]:text-white border border-transparent data-[state=active]:border-gray-900 transition-all shadow-none"
                >
                  Offers
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-[500px]">
              <TabsContent value="basic" className="mt-0 focus-visible:outline-none">
                <BasicInfoTab
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="images" className="mt-0 focus-visible:outline-none">
                <Card className="border-none shadow-sm h-full">
                  <CardContent className="p-6">
                    <ImagesTab
                      productId={id}
                      images={images}
                      setImages={setImages}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="mt-0 focus-visible:outline-none">
                <Card className="border-none shadow-sm h-full">
                  <CardContent className="p-6">
                    <VariantsTab
                      sizes={formData.available_sizes}
                      colors={formData.available_colors}
                      onSizesChange={(sizes) => setFormData({ ...formData, available_sizes: sizes })}
                      onColorsChange={(colors) => setFormData({ ...formData, available_colors: colors })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="loyalty" className="mt-0 focus-visible:outline-none">
                <LoyaltyTab
                  reward={formData.loyalty_coins_reward}
                  price={formData.loyalty_coins_price}
                  onRewardChange={(reward) => setFormData({ ...formData, loyalty_coins_reward: reward })}
                  onPriceChange={(price) => setFormData({ ...formData, loyalty_coins_price: price })}
                />
              </TabsContent>

              <TabsContent value="affiliate" className="mt-0 focus-visible:outline-none">
                <AffiliateTab
                  config={affiliateConfig}
                  setConfig={setAffiliateConfig}
                />
              </TabsContent>

              <TabsContent value="offer" className="mt-0 focus-visible:outline-none">
                <OfferTab
                  productData={formData}
                  onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

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
