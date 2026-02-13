import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAddresses, UserAddress } from "@/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ArrowLeft,
    MapPin,
    Plus,
    Home,
    Briefcase,
    MoreVertical,
    Trash2,
    Edit2,
    CheckCircle2,
    Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shimmer } from "@/components/ui/shimmer";

const Addresses = () => {
    const navigate = useNavigate();
    const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

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

    const resetForm = () => {
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
        setEditingAddress(null);
    };

    const handleEdit = (address: UserAddress) => {
        setEditingAddress(address);
        setFormData({
            full_name: address.full_name,
            phone: address.phone,
            zip_code: address.zip_code,
            state: address.state,
            city: address.city,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || "",
            landmark: address.landmark || "",
            address_type: address.address_type,
            is_default: address.is_default
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await updateAddress(editingAddress.id, formData);
            } else {
                await addAddress(formData);
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving address:", error);
        }
    };

    const confirmDelete = async () => {
        if (addressToDelete) {
            await deleteAddress(addressToDelete);
            setAddressToDelete(null);
        }
    };

    return (
        <Layout>
            <div className="container py-4 lg:py-8 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight">My Addresses</h1>
                        <p className="text-sm text-muted-foreground">Manage your delivery addresses for a faster checkout</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full shadow-lg hover:shadow-xl transition-all">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Address
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] sm:w-full sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white shadow-xl border-none mx-auto">
                            <DialogHeader className="mb-2">
                                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-center sm:text-left">
                                    {editingAddress ? "Edit Address" : "Add New Address"}
                                </DialogTitle>
                                <DialogDescription className="text-center sm:text-left text-sm sm:text-base">
                                    Fill in the details below to add a new delivery address.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            placeholder="e.g. John Doe"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            required
                                            className="h-11 sm:h-10 text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="10-digit mobile number"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            className="h-11 sm:h-10 text-base"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="zip_code" className="text-sm font-medium">Pincode</Label>
                                        <Input
                                            id="zip_code"
                                            placeholder="6 digits"
                                            value={formData.zip_code}
                                            onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                            required
                                            className="h-11 sm:h-10 text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state" className="text-sm font-medium">State</Label>
                                        <Input
                                            id="state"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            required
                                            className="h-11 sm:h-10 text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-medium">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            required
                                            className="h-11 sm:h-10 text-base"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address1" className="text-sm font-medium">Address Line 1</Label>
                                    <Input
                                        id="address1"
                                        placeholder="House No, Building Name, Street"
                                        value={formData.address_line1}
                                        onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                                        required
                                        className="h-11 sm:h-10 text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address2" className="text-sm font-medium">Address Line 2</Label>
                                    <Input
                                        id="address2"
                                        placeholder="Area, Colony, Sector (Optional)"
                                        value={formData.address_line2}
                                        onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
                                        className="h-11 sm:h-10 text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="landmark" className="text-sm font-medium">Landmark (Optional)</Label>
                                    <Input
                                        id="landmark"
                                        placeholder="E.g. near Apollo Hospital"
                                        value={formData.landmark}
                                        onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                                        className="h-11 sm:h-10 text-base"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Address Type</Label>
                                    <RadioGroup
                                        value={formData.address_type}
                                        onValueChange={(val: any) => setFormData({ ...formData, address_type: val })}
                                        className="flex flex-wrap gap-4"
                                    >
                                        <div className="flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="Home" id="type-home" />
                                            <Label htmlFor="type-home" className="flex items-center gap-1 cursor-pointer">
                                                <Home className="h-4 w-4" /> Home
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="Work" id="type-work" />
                                            <Label htmlFor="type-work" className="flex items-center gap-1 cursor-pointer">
                                                <Briefcase className="h-4 w-4" /> Work
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="Other" id="type-other" />
                                            <Label htmlFor="type-other" className="flex items-center gap-1 cursor-pointer">
                                                MoreVertical Other
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="flex items-center space-x-2 py-1">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={formData.is_default}
                                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_default" className="cursor-pointer text-base sm:text-sm">Set as default address</Label>
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                    <Button type="submit" className="flex-1 rounded-full h-12 text-base font-semibold shadow-md">
                                        {editingAddress ? "Update Address" : "Save Address"}
                                    </Button>
                                    <Button type="button" variant="outline" className="flex-1 rounded-full h-12 text-base font-medium" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => (
                            <Shimmer key={i} className="h-48 rounded-xl" />
                        ))}
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/50">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-semibold">No Saved Addresses</h3>
                        <p className="text-sm text-muted-foreground mb-6">You haven't added any delivery addresses yet.</p>
                        <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-full">
                            Add Your First Address
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                            <Card
                                key={address.id}
                                className={`relative overflow-hidden transition-all hover:shadow-md border-border/50 ${address.is_default ? 'ring-2 ring-primary/20 bg-primary/[0.02]' : ''}`}
                            >
                                {address.is_default && (
                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
                                        <CheckCircle2 className="h-3 w-3" />
                                        DEFAULT
                                    </div>
                                )}

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mr-16">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-md bg-secondary text-secondary-foreground">
                                                {address.address_type === "Home" ? <Home size={14} /> :
                                                    address.address_type === "Work" ? <Briefcase size={14} /> :
                                                        <MapPin size={14} />}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {address.address_type}
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-base mt-2">{address.full_name}</CardTitle>
                                </CardHeader>

                                <CardContent className="pb-4 space-y-3">
                                    <div className="text-sm text-muted-foreground leading-relaxed">
                                        <p>{address.address_line1}</p>
                                        {address.address_line2 && <p>{address.address_line2}</p>}
                                        {address.landmark && <p className="italic text-xs">Landmark: {address.landmark}</p>}
                                        <p>{address.city}, {address.state} - <span className="font-semibold text-foreground">{address.zip_code}</span></p>
                                        <p className="mt-2 text-foreground font-medium flex items-center gap-1.5">
                                            <span className="text-muted-foreground text-xs uppercase font-normal">Phone:</span> {address.phone}
                                        </p>
                                    </div>

                                    <div className="pt-2 flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/5"
                                            onClick={() => handleEdit(address)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                                            onClick={() => setAddressToDelete(address.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            Delete
                                        </Button>
                                        {!address.is_default && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-xs text-muted-foreground ml-auto"
                                                onClick={() => setDefaultAddress(address.id)}
                                            >
                                                Set as Default
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this address from your account. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                            Delete Address
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
};

export default Addresses;
