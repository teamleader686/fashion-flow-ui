import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile, AdminUser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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

    // Fallback: Ensure loading always completes
    const fallbackTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000); // 8 seconds for auth a bit longer than data

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
      // Fetch from both tables to ensure compatibility and robustness
      const [profileRes, userRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
      ]);

      const profileData = profileRes.data;
      const userDBData = userRes.data;

      if (profileData || userDBData) {
        // Merge data, prioritizing users table for core fields if available
        const mergedProfile: UserProfile = {
          id: profileData?.id || userDBData?.id || '',
          user_id: userId,
          email: userDBData?.email || profileData?.email || '',
          full_name: userDBData?.name || profileData?.full_name || '',
          phone: userDBData?.phone_number || profileData?.phone || '',
          role: profileData?.role || 'customer',
          is_active: profileData?.is_active ?? true,
          city: userDBData?.city || profileData?.city,
          gender: (userDBData?.gender as any) || profileData?.gender,
          date_of_birth: userDBData?.date_of_birth || profileData?.date_of_birth,
          anniversary_date: userDBData?.anniversary_date || profileData?.anniversary_date,
          profile_completed: userDBData?.profile_completed ?? profileData?.profile_completed ?? false,
          is_profile_complete: userDBData?.is_profile_complete ?? profileData?.is_profile_complete ?? false,
          loyalty_coins_balance: profileData?.loyalty_coins_balance || 0,
          created_at: userDBData?.created_at || profileData?.created_at || '',
          updated_at: profileData?.updated_at || '',
        };

        setProfile(mergedProfile);

        // If user is admin, fetch admin details
        if (mergedProfile.role === 'admin') {
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
        const storedReferral = localStorage.getItem('affiliate_referral_code');
        if (storedReferral && !mergedProfile.referred_by_affiliate) {
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

            setProfile({ ...mergedProfile, referred_by_affiliate: affiliate.id });
          }
        }
      } else {
        console.warn("User data not found in users or user_profiles table");
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
        // redirectTo: `http://10.178.221.41:8080`,
        redirectTo: `stylebazaarkurti.netlify.app`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
      signIn,
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
