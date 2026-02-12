import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit, Trash2, Power, PowerOff, Search } from 'lucide-react';
import { useOffers } from '@/hooks/useOffers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OfferFormDialog from '@/components/admin/offers/OfferFormDialog';
import type { Offer } from '@/types/offer';

export default function OfferManagement() {
  const { offers, loading, deleteOffer, toggleOfferStatus } = useOffers();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (offer: Offer) => {
    setSelectedOffer(offer);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      try { await deleteOffer(id); } catch (error: any) { alert(error.message); }
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    try { await toggleOfferStatus(offer.id, offer.status); } catch (error: any) { alert(error.message); }
  };

  const getOfferTypeLabel = (type: string) => {
    const labels: Record<string, string> = { flat: 'Flat', percentage: 'Percentage', bogo: 'BOGO', flash_sale: 'Flash Sale', category: 'Category' };
    return labels[type] || type;
  };

  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default' as const;
    if (status === 'scheduled') return 'secondary' as const;
    return 'outline' as const;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Offer Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage product offers & deals</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{offers.filter(o => o.status === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active Offers</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-2xl font-bold">{offers.reduce((s, o) => s + o.total_usage_count, 0)}</div>
            <div className="text-sm text-muted-foreground">Total Usage</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-2xl font-bold">₹{offers.reduce((s, o) => s + o.total_discount_given, 0).toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Discount Given</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="text-2xl font-bold">₹{offers.reduce((s, o) => s + o.total_revenue, 0).toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Revenue</div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search offers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredOffers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: offer.badge_color }} />
                            <span className="font-medium">{offer.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{getOfferTypeLabel(offer.type)}</td>
                        <td className="px-6 py-4 text-sm">
                          {offer.type === 'flat' ? `₹${offer.discount_value}` : `${offer.discount_value}%`}
                          {offer.max_discount && <span className="text-xs text-muted-foreground"> (max ₹{offer.max_discount})</span>}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>{new Date(offer.start_datetime).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">to {new Date(offer.end_datetime).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{offer.total_usage_count}{offer.stock_limit && ` / ${offer.stock_limit}`}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusVariant(offer.status)}>{offer.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(offer)}>
                              {offer.status === 'active' ? <PowerOff className="w-4 h-4 text-orange-600" /> : <Power className="w-4 h-4 text-green-600" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden space-y-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: offer.badge_color }} />
                    <span className="font-semibold">{offer.title}</span>
                  </div>
                  <Badge variant={getStatusVariant(offer.status)} className="text-xs">{offer.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{getOfferTypeLabel(offer.type)}</span></div>
                  <div><span className="text-muted-foreground">Discount:</span> <span className="font-medium">{offer.type === 'flat' ? `₹${offer.discount_value}` : `${offer.discount_value}%`}</span></div>
                  <div><span className="text-muted-foreground">Usage:</span> <span className="font-medium">{offer.total_usage_count}</span></div>
                  <div><span className="text-muted-foreground">Ends:</span> <span className="font-medium">{new Date(offer.end_datetime).toLocaleDateString()}</span></div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleStatus(offer)} className="flex-1">
                    {offer.status === 'active' ? <><PowerOff className="w-4 h-4 mr-1" /> Deactivate</> : <><Power className="w-4 h-4 mr-1" /> Activate</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(offer)} className="flex-1"><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(offer.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No offers found</p></CardContent></Card>
        )}

        <OfferFormDialog open={formOpen} onClose={() => { setFormOpen(false); setSelectedOffer(null); }} offer={selectedOffer} />
      </div>
    </AdminLayout>
  );
}
