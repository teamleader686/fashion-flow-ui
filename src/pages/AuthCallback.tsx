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
        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        try {
            // Get the session from the URL hash
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            if (session) {
                // Check if user profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    // Error other than "not found"
                    throw profileError;
                }

                if (!profile) {
                    // Create user profile
                    const { error: insertError } = await supabase
                        .from('user_profiles')
                        .insert({
                            user_id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.full_name ||
                                session.user.user_metadata?.name ||
                                session.user.email?.split('@')[0] || '',
                            avatar_url: session.user.user_metadata?.avatar_url ||
                                session.user.user_metadata?.picture || '',
                            phone: session.user.user_metadata?.phone || '',
                            role: 'customer',
                            is_active: true,
                            profile_completed: false,
                        });

                    if (insertError) {
                        console.error('Error creating profile:', insertError);
                        // Don't throw - profile will be created by trigger or next login
                    }
                }

                setStatus('success');
                setMessage('Login successful! Redirecting...');
                toast.success('Welcome! 🎉');

                // Redirect after short delay
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1500);
            } else {
                throw new Error('No session found');
            }
        } catch (error: any) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            toast.error('Login failed. Please try again.');

            // Redirect to login after delay
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
        }
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
