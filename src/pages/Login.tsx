import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShoppingBag } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, location]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            toast.success('Redirecting to Google...');
        } catch (error: any) {
            console.error('Google login error:', error);
            toast.error(error.message || 'Failed to login with Google');
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_32px_64px_rgba(0,0,0,0.1)]">
                <CardHeader className="space-y-6 text-center pt-12 pb-8">
                    {/* Premium Logo Section */}
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 rounded-[2.2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative h-24 w-24 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                                <ShoppingBag className="h-12 w-12 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div className="space-y-3 px-4">
                        <CardTitle className="text-4xl font-black tracking-tight text-gray-900">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-lg font-medium text-gray-500 leading-relaxed">
                            Continue with Google to access your account
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-10 px-8 pb-16">
                    {/* Single Google Login Button */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <Button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="relative w-full h-16 bg-white hover:bg-gray-50 text-gray-700 border-none shadow-xl rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-4 overflow-hidden"
                            variant="outline"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                            ) : (
                                <>
                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold tracking-tight uppercase">Continue with Google</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Minimal Footer */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <div className="h-[1px] w-8 bg-gray-200"></div>
                            Secure Auth
                            <div className="h-[1px] w-8 bg-gray-200"></div>
                        </div>

                        <p className="text-[13px] text-center text-gray-400 leading-relaxed px-4 font-medium">
                            By continuing, you acknowledge that you have read and agree to our{' '}
                            <a href="/terms" className="text-gray-900 font-bold hover:text-pink-600 transition-colors underline underline-offset-4">
                                Terms
                            </a>{' '}
                            &{' '}
                            <a href="/privacy" className="text-gray-900 font-bold hover:text-pink-600 transition-colors underline underline-offset-4">
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
