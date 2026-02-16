import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/types/slider';
import { useSliders } from '@/hooks/useSliders';
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Image as ImageIcon, ExternalLink, Power, PowerOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import storageLogger from '@/lib/storageLogger';

export default function SliderManagement() {
    const { sliders, loading, addSlider, updateSlider, deleteSlider } = useSliders();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        redirect_url: '',
        display_order: 0,
        status: 'active' as 'active' | 'inactive',
    });

    const handleOpenDialog = (slider?: Slider) => {
        if (slider) {
            setEditingSlider(slider);
            setFormData({
                title: slider.title || '',
                subtitle: slider.subtitle || '',
                image_url: slider.image_url,
                redirect_url: slider.redirect_url || '',
                display_order: slider.display_order,
                status: slider.status,
            });
        } else {
            setEditingSlider(null);
            setFormData({
                title: '',
                subtitle: '',
                image_url: '',
                redirect_url: '',
                display_order: sliders.length,
                status: 'active',
            });
        }
        setIsDialogOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `sliders/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('website-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('website-assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            // Log slider image upload
            storageLogger.logFileUpload(
                'sliders',
                'website-assets',
                filePath,
                storageLogger.getFileSizeKB(file)
            );
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error('Failed to upload image: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.image_url) {
            toast.error('Please upload an image or provide an image URL');
            return;
        }

        if (editingSlider) {
            await updateSlider(editingSlider.id, formData);
        } else {
            await addSlider(formData);
        }
        setIsDialogOpen(false);
    };

    const handleToggleStatus = (slider: Slider) => {
        updateSlider(slider.id, {
            status: slider.status === 'active' ? 'inactive' : 'active'
        });
    };

    const handleMoveOrder = (slider: Slider, direction: 'up' | 'down') => {
        const currentIndex = sliders.findIndex(s => s.id === slider.id);
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === sliders.length - 1) return;

        const otherSlider = sliders[direction === 'up' ? currentIndex - 1 : currentIndex + 1];

        // Swap display orders
        updateSlider(slider.id, { display_order: otherSlider.display_order });
        updateSlider(otherSlider.id, { display_order: slider.display_order });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Home Page Slider Management</h2>
                    <p className="text-sm text-muted-foreground">Manage your website's hero carousel sliders</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slider
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : sliders.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 opacity-60">
                        <ImageIcon className="h-12 w-12 mb-4" />
                        <p>No sliders found. Add your first slider!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sliders.map((slider) => (
                        <Card key={slider.id} className="overflow-hidden group relative">
                            <div className="aspect-[21/9] relative overflow-hidden bg-muted">
                                <img
                                    src={slider.image_url}
                                    alt={slider.title || 'Slider Image'}
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Badge variant={slider.status === 'active' ? 'default' : 'secondary'} className="shadow-sm">
                                        {slider.status}
                                    </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button size="icon" variant="secondary" onClick={() => handleOpenDialog(slider)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" onClick={() => deleteSlider(slider.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-bold truncate">{slider.title || 'Untitled'}</h3>
                                <p className="text-xs text-muted-foreground truncate mb-3">{slider.subtitle || 'No subtitle'}</p>

                                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            disabled={sliders.indexOf(slider) === 0}
                                            onClick={() => handleMoveOrder(slider, 'up')}
                                        >
                                            <MoveUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            disabled={sliders.indexOf(slider) === sliders.length - 1}
                                            onClick={() => handleMoveOrder(slider, 'down')}
                                        >
                                            <MoveDown className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                            onClick={() => handleToggleStatus(slider)}
                                        >
                                            {slider.status === 'active' ? (
                                                <><PowerOff className="h-3 w-3 mr-1" /> Disable</>
                                            ) : (
                                                <><Power className="h-3 w-3 mr-1" /> Enable</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Slider Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSlider ? 'Edit Slider' : 'Add New Slider'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Slider Title (Optional)</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Summer Collection"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subtitle (Optional)</Label>
                                <Input
                                    value={formData.subtitle}
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="e.g. Up to 50% Off"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Redirect Link (Optional)</Label>
                                <Input
                                    value={formData.redirect_url}
                                    onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
                                    placeholder="e.g. /products/summer-collection"
                                />
                                {formData.redirect_url && (
                                    <p className="text-[10px] text-muted-foreground flex items-center">
                                        <ExternalLink className="h-2 w-2 mr-1" /> Will navigate to {formData.redirect_url}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <div className="space-y-0.5">
                                    <Label>Status</Label>
                                    <p className="text-xs text-muted-foreground">Make this slider visible</p>
                                </div>
                                <Switch
                                    checked={formData.status === 'active'}
                                    onCheckedChange={checked => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>Slider Image</Label>
                            <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center aspect-video relative overflow-hidden bg-muted group">
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Button variant="secondary" size="sm" onClick={() => document.getElementById('slider-img-upload')?.click()}>
                                                Change Image
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-xs">Click to upload image</p>
                                        <p className="text-[10px] opacity-60">Recommended 1920x800px</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            disabled={isUploading}
                                            onClick={() => document.getElementById('slider-img-upload')?.click()}
                                        >
                                            {isUploading ? 'Uploading...' : 'Upload Image'}
                                        </Button>
                                    </div>
                                )}
                                <input
                                    id="slider-img-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Or Image URL</Label>
                                <Input
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isUploading}>
                            {editingSlider ? 'Update Slider' : 'Create Slider'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
