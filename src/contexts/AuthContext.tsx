import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile, AdminUser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  adminUser: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setAdminUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // If user is admin, fetch admin details
      if (profileData?.role === 'admin') {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!adminError && adminData) {
          setAdminUser(adminData);
        }
      }

      // Check for stored referral and link if needed
      const storedReferral = localStorage.getItem('affiliate_referral');
      if (storedReferral && !profileData?.referred_by_affiliate) {
        // Find affiliate by code
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('referral_code', storedReferral)
          .eq('status', 'active')
          .single();

        if (affiliate) {
          await supabase
            .from('user_profiles')
            .update({ referred_by_affiliate: affiliate.id })
            .eq('user_id', userId);

          // Update local profile state as well
          setProfile({ ...profileData, referred_by_affiliate: affiliate.id });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
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

  const isAdmin = profile?.role === 'admin' && adminUser?.is_active === true;

  return (
    <AuthContext.Provider value={{ user, profile, adminUser, loading, signIn, signOut, isAdmin }}>
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
