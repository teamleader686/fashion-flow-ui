import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Store,
  CreditCard,
  Truck,
  Award,
  Bell,
  Palette,
  Globe,
  Shield,
  Layout as LayoutIcon,
} from 'lucide-react';
import SliderManagement from '@/components/admin/SliderManagement';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your store settings</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="general" className="text-xs"><Store className="h-3 w-3 mr-1" />General</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs"><CreditCard className="h-3 w-3 mr-1" />Payment</TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs"><Truck className="h-3 w-3 mr-1" />Shipping</TabsTrigger>
            <TabsTrigger value="loyalty" className="text-xs"><Award className="h-3 w-3 mr-1" />Loyalty</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs"><Bell className="h-3 w-3 mr-1" />Notify</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs"><Palette className="h-3 w-3 mr-1" />Theme</TabsTrigger>
            <TabsTrigger value="homepage" className="text-xs"><LayoutIcon className="h-3 w-3 mr-1" />Home Sliders</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs"><Globe className="h-3 w-3 mr-1" />SEO</TabsTrigger>
            <TabsTrigger value="security" className="text-xs"><Shield className="h-3 w-3 mr-1" />Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Store Name</Label>
                    <Input defaultValue="StyleBazaar" />
                  </div>
                  <div className="space-y-2">
                    <Label>Store Email</Label>
                    <Input type="email" defaultValue="contact@stylebazaar.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Store Phone</Label>
                    <Input defaultValue="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input defaultValue="INR (₹)" disabled />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input placeholder="Street address" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN Code</Label>
                    <Input placeholder="PIN Code" />
                  </div>
                </div>

                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Cash on Delivery (COD)</h3>
                    <p className="text-sm text-muted-foreground">Allow customers to pay on delivery</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Online Payment (Razorpay)</h3>
                    <p className="text-sm text-muted-foreground">Accept UPI, Cards, Net Banking</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Wallet Payment</h3>
                    <p className="text-sm text-muted-foreground">Allow wallet balance for payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Shipping Cost (₹)</Label>
                    <Input type="number" defaultValue="49" />
                  </div>
                  <div className="space-y-2">
                    <Label>Free Shipping Above (₹)</Label>
                    <Input type="number" defaultValue="499" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Enable Free Shipping</h3>
                    <p className="text-sm text-muted-foreground">Free shipping for orders above threshold</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty & Coins Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Enable Loyalty Program</h3>
                    <p className="text-sm text-muted-foreground">Allow customers to earn and redeem coins</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coins Per ₹1 Spent</Label>
                    <Input type="number" defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Signup Bonus Coins</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Coins Redeemable (%)</Label>
                    <Input type="number" defaultValue="50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Coin Expiry (Days)</Label>
                    <Input type="number" defaultValue="365" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  'Order Confirmation',
                  'Shipping Update',
                  'Delivery Confirmation',
                  'Return/Refund Update',
                  'Promotional Notifications',
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{item}</h3>
                      <p className="text-sm text-muted-foreground">Send {item.toLowerCase()} to customers</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#0B6B4F" className="w-14 h-10 p-1" />
                      <Input defaultValue="#0B6B4F" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" defaultValue="#E8735A" className="w-14 h-10 p-1" />
                      <Input defaultValue="#E8735A" className="flex-1" />
                    </div>
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homepage" className="mt-6">
            <SliderManagement />
          </TabsContent>

          <TabsContent value="seo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input defaultValue="StyleBazaar - Women's Fashion Store" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Input defaultValue="Shop the latest women's fashion at StyleBazaar. Kurtis, dresses & more." />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add extra security to admin login</p>
                  </div>
                  <Switch />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
