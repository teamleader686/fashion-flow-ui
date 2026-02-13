import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Phone, Mail, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const { user, profile } = useAuth();
    const { updateProfile, updating } = useProfile();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                phone: profile.phone || "",
                email: profile.email || user?.email || "",
            });
        }
    }, [profile, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile({
            full_name: formData.full_name,
            phone: formData.phone,
        });
    };

    return (
        <Layout>
            <div className="container py-4 lg:py-8 max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </button>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border/50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User size={32} />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <CardDescription>Update your profile details and contact info</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="pl-10"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={formData.email}
                                        disabled
                                        className="pl-10 bg-secondary/50"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-10"
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto min-w-[150px] rounded-full"
                                    disabled={updating}
                                >
                                    {updating ? "Saving Changes..." : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default Profile;
