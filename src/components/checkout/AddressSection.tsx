import { useState, useEffect } from "react";
import { useAddresses, UserAddress } from "@/hooks/useAddresses";
import { MapPin, Plus, CheckCircle2, Home, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shimmer } from "@/components/ui/shimmer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddressSectionProps {
    selectedAddressId: string | null;
    onSelect: (address: UserAddress) => void;
}

export const AddressSection = ({ selectedAddressId, onSelect }: AddressSectionProps) => {
    const { addresses, loading, addAddress } = useAddresses();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        zip_code: "",
        state: "",
        city: "",
        address_line1: "",
        address_line2: "",
        landmark: "",
        address_type: "Home" as "Home" | "Work" | "Other",
        is_default: false
    });

    // Auto-select default address on load
    useEffect(() => {
        if (!selectedAddressId && addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            onSelect(defaultAddr);
        }
    }, [addresses, selectedAddressId, onSelect]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newAddr = await addAddress(formData);
            if (newAddr) {
                onSelect(newAddr);
                setIsDialogOpen(false);
                setFormData({
                    full_name: "",
                    phone: "",
                    zip_code: "",
                    state: "",
                    city: "",
                    address_line1: "",
                    address_line2: "",
                    landmark: "",
                    address_type: "Home",
                    is_default: false
                });
            }
        } catch (error) {
            console.error("Error adding address during checkout:", error);
        }
    };

    if (loading) {
        return <Shimmer className="h-40 w-full rounded-xl" />;
    }

    return (
        <div className="space-y-4">
            {addresses.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-xl text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">No addresses saved yet</p>
                    <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm" className="rounded-full">
                        <Plus className="h-4 w-4 mr-2" /> Add Address
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((address) => (
                        <Card
                            key={address.id}
                            className={`p-4 cursor-pointer transition-all border-border relative ${selectedAddressId === address.id
                                ? 'ring-2 ring-primary border-primary/50 bg-primary/[0.02]'
                                : 'hover:border-primary/30'
                                }`}
                            onClick={() => onSelect(address)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1.5">
                                    {address.address_type === "Home" ? <Home size={12} className="text-muted-foreground" /> :
                                        address.address_type === "Work" ? <Briefcase size={12} className="text-muted-foreground" /> :
                                            <MapPin size={12} className="text-muted-foreground" />}
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">{address.address_type}</span>
                                </div>
                                {selectedAddressId === address.id && (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                            </div>
                            <p className="text-sm font-bold truncate">{address.full_name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{address.address_line1}</p>
                            {address.address_line2 && <p className="text-xs text-muted-foreground line-clamp-1">{address.address_line2}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">{address.city}, {address.zip_code}</p>
                            <p className="text-xs font-medium mt-2">{address.phone}</p>
                        </Card>
                    ))}

                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="p-4 border border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors h-full min-h-[120px]"
                    >
                        <Plus className="h-4 w-4" />
                        Add New
                    </button>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                        <DialogDescription>Save a new address for faster checkout</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="checkout-full_name">Full Name</Label>
                                <Input
                                    id="checkout-full_name"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="checkout-phone">Phone Number</Label>
                                <Input
                                    id="checkout-phone"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="checkout-zip_code">Pincode</Label>
                                <Input
                                    id="checkout-zip_code"
                                    value={formData.zip_code}
                                    onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="checkout-city">City</Label>
                                <Input
                                    id="checkout-city"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="checkout-state">State</Label>
                                <Input
                                    id="checkout-state"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="checkout-address1">Address Line 1</Label>
                            <Input
                                id="checkout-address1"
                                value={formData.address_line1}
                                onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="checkout-address2">Address Line 2</Label>
                            <Input
                                id="checkout-address2"
                                value={formData.address_line2}
                                onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Address Type</Label>
                            <RadioGroup
                                value={formData.address_type}
                                onValueChange={(val: any) => setFormData({ ...formData, address_type: val })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Home" id="checkout-home" />
                                    <Label htmlFor="checkout-home" className="cursor-pointer">Home</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Work" id="checkout-work" />
                                    <Label htmlFor="checkout-work" className="cursor-pointer">Work</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <Button type="submit" className="w-full rounded-full">Save and Use Address</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
