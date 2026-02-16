import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Share2, ArrowRight } from 'lucide-react';

export default function AffiliateLogin() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { affiliateLogin, loading } = useAffiliateMarketing();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mobile || !password) {
            toast.error('Please enter both mobile number and password');
            return;
        }

        const result = await affiliateLogin(mobile, password);

        if (result.success) {
            toast.success('Login successful!');
            navigate('/affiliate-dashboard');
        } else {
            toast.error(result.error || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Share2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Affiliate Portal</h1>
                    <p className="opacity-90 mt-2">Sign in to manage your earnings</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <Input
                                id="mobile"
                                type="tel"
                                placeholder="Enter your registered mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-pink-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logging in...
                                </div>
                            ) : (
                                <>
                                    Sign In to Dashboard
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        <p>Don't have an affiliate account?</p>
                        <Link to="/contact" className="text-pink-600 font-medium hover:underline">
                            Contact Admin to Join
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
