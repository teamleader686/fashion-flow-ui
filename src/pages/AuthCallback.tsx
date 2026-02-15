import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing authentication...');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // 1. Check for errors in the URL redirect
                const url = new URL(window.location.href);
                const errorName = url.searchParams.get("error");
                const errorDescription = url.searchParams.get("error_description");

                if (errorName) {
                    throw new Error(errorDescription || errorName);
                }

                // 2. Handle PKCE flow exchange if code exists in URL
                const code = url.searchParams.get("code");
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                }

                // 3. Get the current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (!session) {
                    throw new Error("No active session found. Please try logging in again.");
                }

                // 4. Save user to DB and redirect
                await saveUserToDB(session.user);

                setStatus('success');
                setMessage('Login successful! Redirecting...');
                toast.success('Welcome! 🎉');

                navigate("/", { replace: true });

            } catch (err: any) {
                console.error("Auth callback error:", err);
                handleAuthError(err);
            }
        };

        handleAuth();
    }, [navigate]);

    const saveUserToDB = async (user: any) => {
        try {
            // 1. Check if user already exists to avoid resetting profile_completed
            const { data: existingUser } = await supabase
                .from('users')
                .select('profile_completed')
                .eq('id', user.id)
                .maybeSingle();

            const userData: any = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
                updated_at: new Date().toISOString(),
            };

            // Only set profile_completed for brand new users
            if (!existingUser) {
                userData.profile_completed = false;
                userData.created_at = new Date().toISOString();
            }

            console.log("Syncing user data to DB:", userData);

            const { error: upsertError } = await supabase
                .from('users')
                .upsert(userData, { onConflict: 'id' });

            if (upsertError) {
                console.error('Error syncing to users table:', upsertError);
            }

            // 2. Also sync to user_profiles for legacy compatibility
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    email: user.email || '',
                    full_name: userData.name,
                    avatar_url: userData.profile_image,
                    role: 'customer',
                    is_active: true,
                    // Note: we don't overwrite profile_completed here either
                }, { onConflict: 'user_id', ignoreDuplicates: false });

            if (profileError) console.error('Error syncing to user_profiles:', profileError);
        } catch (err) {
            console.error('saveUserToDB failed:', err);
        }
    };

    const handleAuthError = (error: any) => {
        console.error('Final Auth Error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        toast.error('Login failed. Please try again.');

        setTimeout(() => {
            navigate('/login', { replace: true });
        }, 3000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
            <div className="text-center space-y-6 p-8">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
                            <p className="text-muted-foreground">Please wait...</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
                            <p className="text-muted-foreground">Taking you to the homepage...</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Authentication Failed</h2>
                            <p className="text-muted-foreground">{message}</p>
                            <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
