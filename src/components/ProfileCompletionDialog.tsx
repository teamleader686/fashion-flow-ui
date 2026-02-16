import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Phone, MapPin, Gift, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileCompletionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export default function ProfileCompletionDialog({
    open,
    onOpenChange,
    onComplete,
}: ProfileCompletionDialogProps) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date>();
    const [anniversaryDate, setAnniversaryDate] = useState<Date>();
    const [gender, setGender] = useState('');

    // Validation state
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            setCity(profile.city || '');
            setGender(profile.gender || '');
            if (profile.date_of_birth) {
                setDateOfBirth(new Date(profile.date_of_birth));
            }
            if (profile.anniversary_date) {
                setAnniversaryDate(new Date(profile.anniversary_date));
            }
        }
    }, [profile]);

    const validatePhone = (value: string): boolean => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length < 10) {
            setPhoneError('Phone number must be at least 10 digits');
            return false;
        }
        if (cleaned.length > 15) {
            setPhoneError('Phone number is too long');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        if (value) {
            validatePhone(value);
        } else {
            setPhoneError('');
        }
    };

    const canProceedToStep2 = () => {
        return fullName.trim() !== '' && phone.trim() !== '' && !phoneError;
    };

    const handleStep1Submit = () => {
        if (!fullName.trim()) {
            toast.error('Please enter your full name');
            return;
        }
        if (!phone.trim()) {
            toast.error('Please enter your phone number');
            return;
        }
        if (!validatePhone(phone)) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const dateStr = dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null;
            const annivStr = anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : null;

            console.log('Saving profile for user:', user.id);

            // 1. Update 'users' table (Main requested table)
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: fullName.trim(),
                    phone_number: phone.trim(),
                    city: city.trim() || null,
                    date_of_birth: dateStr,
                    anniversary_date: annivStr,
                    gender: gender || null,
                    profile_completed: true
                })
                .eq('id', user.id);

            if (userError) throw userError;

            // 2. Update 'user_profiles' table (App compatibility)
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    email: user.email || '',
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    city: city.trim() || null,
                    gender: gender || null,
                    date_of_birth: dateStr,
                    anniversary_date: annivStr,
                    profile_completed: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (profileError) throw profileError;

            toast.success('Profile completed successfully! 🎉');

            // 🎯 Critical Fix: Stop loading and close dialog BEFORE triggering reload
            onOpenChange(false);

            // Give the UI time to close the dialog and show toast before reload
            if (onComplete) {
                setTimeout(() => {
                    onComplete();
                }, 500);
            }

        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false); // Ensure loading stops on error or success
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {step === 1 ? '👋 Complete Your Profile' : '✨ Tell Us More About You'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? 'We need some basic information to process your orders and keep you updated.'
                            : 'Help us personalize your experience with special offers on your special days!'}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        step >= 1 ? "bg-primary" : "bg-muted"
                    )} />
                    <div className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        step >= 2 ? "bg-primary" : "bg-muted"
                    )} />
                </div>

                {step === 1 ? (
                    // Step 1: Required Fields
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Mobile Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter your mobile number"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className={phoneError ? 'border-red-500' : ''}
                            />
                            {phoneError && (
                                <p className="text-sm text-red-500">{phoneError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                We'll use this for order updates and WhatsApp notifications
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={handleStep1Submit}
                                className="w-full"
                                disabled={!canProceedToStep2() || loading}
                            >
                                Continue to Next Step →
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Step 2: Optional Fields
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="city" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                City
                            </Label>
                            <Input
                                id="city"
                                placeholder="Enter your city"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Gift className="h-4 w-4" />
                                Date of Birth
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !dateOfBirth && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateOfBirth ? format(dateOfBirth, 'PPP') : 'Pick your birthday'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateOfBirth}
                                        onSelect={setDateOfBirth}
                                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">
                                Get special birthday offers! 🎂
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                Anniversary Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal',
                                            !anniversaryDate && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {anniversaryDate ? format(anniversaryDate, 'PPP') : 'Pick your anniversary'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={anniversaryDate}
                                        onSelect={setAnniversaryDate}
                                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">
                                Celebrate with exclusive anniversary discounts! 💝
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                disabled={loading}
                            >
                                ← Back
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                            >
                                {loading ? 'Saving Profile...' : 'Complete Profile 🎉'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Required fields note */}
                {step === 1 && (
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        <span className="text-red-500">*</span> Required fields
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
