import { useState } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, Search, TrendingUp } from 'lucide-react';
import { useOffers } from '@/hooks/useOffers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      try {
        await deleteOffer(id);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    try {
      await toggleOfferStatus(offer.id, offer.status);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedOffer(null);
  };

  const getOfferTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      flat: 'Flat Discount',
      percentage: 'Percentage',
      bogo: 'BOGO',
      flash_sale: 'Flash Sale',
      category: 'Category Offer'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Management</h1>
          <p className="text-gray-600 mt-1">Create and manage product offers & deals</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Offers</p>
              <p className="text-2xl font-bold text-gray-900">
                {offers.filter(o => o.status === 'active').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {offers.reduce((sum, o) => sum + o.total_usage_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Discount Given</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{offers.reduce((sum, o) => sum + o.total_discount_given, 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{offers.reduce((sum, o) => sum + o.total_revenue, 0).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search offers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOffers.map((offer) => (
              <tr key={offer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: offer.badge_color }}
                    />
                    <span className="font-medium">{offer.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getOfferTypeLabel(offer.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {offer.type === 'flat' ? `₹${offer.discount_value}` : `${offer.discount_value}%`}
                  {offer.max_discount && <span className="text-xs text-gray-500"> (max ₹{offer.max_discount})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>{new Date(offer.start_datetime).toLocaleDateString()}</div>
                  <div className="text-gray-500">to {new Date(offer.end_datetime).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {offer.total_usage_count}
                  {offer.stock_limit && ` / ${offer.stock_limit}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(offer.status)}`}>
                    {offer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(offer)}
                      title={offer.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {offer.status === 'active' ? (
                        <PowerOff className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Power className="w-4 h-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(offer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(offer.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: offer.badge_color }}
                />
                <span className="font-semibold">{offer.title}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(offer.status)}`}>
                {offer.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 font-medium">{getOfferTypeLabel(offer.type)}</span>
              </div>
              <div>
                <span className="text-gray-500">Discount:</span>
                <span className="ml-1 font-medium">
                  {offer.type === 'flat' ? `₹${offer.discount_value}` : `${offer.discount_value}%`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Usage:</span>
                <span className="ml-1 font-medium">{offer.total_usage_count}</span>
              </div>
              <div>
                <span className="text-gray-500">Ends:</span>
                <span className="ml-1 font-medium">
                  {new Date(offer.end_datetime).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(offer)}
                className="flex-1"
              >
                {offer.status === 'active' ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(offer)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(offer.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOffers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No offers found</p>
        </div>
      )}

      {/* Dialog */}
      <OfferFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        offer={selectedOffer}
      />
    </div>
  );
}
