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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isEdit ? 'Update product details' : 'Create a new product'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>

        {/* Form Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="loyalty">Loyalty Coins</TabsTrigger>
                <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
                <TabsTrigger value="offer">Offers</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <BasicInfoTab
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="images">
                <ImagesTab
                  productId={id}
                  images={images}
                  setImages={setImages}
                />
              </TabsContent>

              <TabsContent value="loyalty">
                <LoyaltyTab
                  config={loyaltyConfig}
                  setConfig={setLoyaltyConfig}
                />
              </TabsContent>

              <TabsContent value="affiliate">
                <AffiliateTab
                  config={affiliateConfig}
                  setConfig={setAffiliateConfig}
                />
              </TabsContent>

              <TabsContent value="offer">
                <OfferTab
                  offer={offer}
                  setOffer={setOffer}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
