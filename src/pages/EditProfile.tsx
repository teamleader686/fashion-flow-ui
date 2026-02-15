import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CalendarIcon, User, Phone, MapPin, Mail, Gift, Heart, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function EditProfile() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date>();
    const [anniversaryDate, setAnniversaryDate] = useState<Date>();
    const [gender, setGender] = useState('');

    // Validation state
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (profile) {
            setFullName(profile.full_name || '');
            setPhone(profile.phone || '');
            setEmail(profile.email || user.email || '');
            setCity(profile.city || '');
            setGender(profile.gender || '');
            if (profile.date_of_birth) {
                setDateOfBirth(new Date(profile.date_of_birth));
            }
            if (profile.anniversary_date) {
                setAnniversaryDate(new Date(profile.anniversary_date));
            }
        }
    }, [user, profile, navigate]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

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

        setLoading(true);
        try {
            const updateData: any = {
                full_name: fullName.trim(),
                phone: phone.trim(),
                email: email.trim(),
                profile_completed: true,
                updated_at: new Date().toISOString(),
            };

            // Add optional fields
            if (city.trim()) {
                updateData.city = city.trim();
            } else {
                updateData.city = null;
            }

            if (gender) {
                updateData.gender = gender;
            } else {
                updateData.gender = null;
            }

            if (dateOfBirth) {
                updateData.date_of_birth = format(dateOfBirth, 'yyyy-MM-dd');
            } else {
                updateData.date_of_birth = null;
            }

            if (anniversaryDate) {
                updateData.anniversary_date = format(anniversaryDate, 'yyyy-MM-dd');
            } else {
                updateData.anniversary_date = null;
            }

            // 1. Update 'users' table (Main table)
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: fullName.trim(),
                    phone_number: phone.trim(),
                    city: city.trim() || null,
                    gender: gender || null,
                    date_of_birth: updateData.date_of_birth,
                    anniversary_date: updateData.anniversary_date,
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (userError) throw userError;

            // 2. Update 'user_profiles' table (Compatibility table)
            // Use upsert to handle cases where record might be missing
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    email: email.trim(),
                    full_name: fullName.trim(),
                    phone: phone.trim(),
                    city: city.trim() || null,
                    gender: gender || null,
                    date_of_birth: updateData.date_of_birth,
                    anniversary_date: updateData.anniversary_date,
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            toast.success('Profile updated successfully! 🎉');

            // Refresh to update profile data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isProfileComplete = fullName.trim() !== '' && phone.trim() !== '' && !phoneError;

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <User className="h-6 w-6" />
                        Edit Profile
                    </CardTitle>
                    <CardDescription>
                        Update your personal information and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Completion Status */}
                        {isProfileComplete && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Profile Complete</span>
                            </div>
                        )}

                        {/* Required Fields Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Required Information</h3>

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
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email <span className="text-muted-foreground text-xs">(Read-only)</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Contact support to change your email address
                                </p>
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
                                    required
                                />
                                {phoneError && (
                                    <p className="text-sm text-red-500">{phoneError}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Used for order updates and WhatsApp notifications
                                </p>
                            </div>
                        </div>

                        {/* Optional Fields Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold">Additional Information</h3>
                            <p className="text-sm text-muted-foreground">
                                Help us personalize your experience with special offers!
                            </p>

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
                                            {anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : 'Pick your anniversary'}
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
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(-1)}
                                disabled={loading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !isProfileComplete}
                                className="flex-1"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
