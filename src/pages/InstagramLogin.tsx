import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InstagramLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile_number: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile_number)) {
      toast({
        title: 'Invalid Mobile Number',
        description: 'Please enter a valid 10-digit mobile number.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Verify this mobile number belongs to an Instagram Marketing user
      console.log('Searching for user with mobile:', formData.mobile_number);

      const { data: instagramUser, error: userError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('mobile_number', formData.mobile_number)
        .maybeSingle();

      if (userError) throw userError;

      console.log('User found:', instagramUser);

      if (!instagramUser) {
        throw new Error(`This mobile number (${formData.mobile_number}) is not registered for Instagram Marketing. Please contact your administrator.`);
      }

      if (instagramUser.status !== 'active') {
        throw new Error('Your account is inactive. Please contact your administrator.');
      }

      // 2. Attempt to Sign In using the email linked to this mobile number
      console.log('--- Attempting Sign In ---');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: instagramUser.email,
        password: formData.password
      });

      let authUser = signInData?.user;

      if (signInError) {
        console.log('Sign in failed:', signInError.message);

        // Handle unconfirmed email specifically - BYPASS if password matches local record
        if (signInError.message.includes('Email not confirmed')) {
          console.log('Email unconfirmed. Verifying against local record...');

          // Verify password against local record
          if (instagramUser.password === formData.password) {
            console.log('Local password verified. Bypassing email confirmation.');

            // FORCE LOGIN SUCCESS
            // Since we don't have a Supabase session, we must rely on local storage or context
            // to tell the dashboard who is logged in.
            localStorage.setItem('instagram_user_id', instagramUser.id);

            toast({
              title: 'Logged in successfully',
              description: `Welcome back, ${instagramUser.name || instagramUser.instagram_username}`
            });

            navigate('/instagram-dashboard');
            return; // EXIT FUNCTION HERE
          }
        }

        // 3. Fallback to Sign Up if user doesn't exist in Auth
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('--- Attempting Sign Up (Initial User Setup) ---');

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: instagramUser.email,
            password: formData.password,
            options: {
              data: {
                role: 'instagram_user'
              }
            }
          });

          if (signUpError) {
            console.log('Sign up failed:', signUpError.message);

            if (signUpError.message.includes('User already registered')) {
              throw new Error('Incorrect password. Please use the password assigned to you.');
            }
            throw signUpError;
          }

          authUser = signUpData.user;
          // If signup was successful but no session, it means email confirmation is required
          if (authUser && !signUpData.session) {
            throw new Error(`Account created but Email Confirmation is enabled! Admin must disable 'Confirm Email' in Supabase settings.`);
          }
        } else {
          throw signInError;
        }
      }

      if (!authUser) throw new Error('Could not establish authentication session.');

      // 4. Link the instagram_user record to this Auth UID
      const { error: updateError } = await supabase
        .from('instagram_users')
        .update({ auth_user_id: authUser.id })
        .eq('id', instagramUser.id);

      if (updateError) {
        console.error('Record linking error (non-fatal):', updateError);
      }

      toast({
        title: 'Logged in successfully',
        description: `Welcome back, ${instagramUser.name || instagramUser.instagram_username}`
      });

      navigate('/instagram-dashboard');
    } catch (error: any) {
      console.error('Instagram Login Flow Error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred during login.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-lg">
              <Instagram className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Influencer Portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Login with your mobile credentials
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '') })}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your security password"
                className="h-12"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition-all font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access My Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
