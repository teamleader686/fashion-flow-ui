import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile, AdminUser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check active session on load
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          console.log("User already logged in:", session.user.email);
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          console.log("No active session found");
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (mounted) setLoading(false);
      }
    };

    checkInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (session?.user) {
        console.log("User logged in:", session.user.email);
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        console.log("User logged out");
        setUser(null);
        setProfile(null);
        setAdminUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile from user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors if not found

      if (profileData) {
        setProfile(profileData);

        // If user is admin, fetch admin details
        if (profileData.role === 'admin') {
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!adminError && adminData) {
            setAdminUser(adminData);
          }
        }

        // Check for stored referral and link if needed
        const storedReferral = localStorage.getItem('affiliate_referral');
        if (storedReferral && !profileData.referred_by_affiliate) {
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('referral_code', storedReferral)
            .eq('status', 'active')
            .maybeSingle();

          if (affiliate) {
            await supabase
              .from('user_profiles')
              .update({ referred_by_affiliate: affiliate.id })
              .eq('user_id', userId);

            setProfile({ ...profileData, referred_by_affiliate: affiliate.id });
          }
        }
      } else {
        console.warn("User profile not found in user_profiles table");
        // We'll keep profile as null, but user is still set from session
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setAdminUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin' && adminUser?.is_active === true;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      adminUser,
      loading,
      signInWithGoogle,
      signOut,
      isAdmin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
