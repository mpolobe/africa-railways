import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, AuthResponse } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  country?: string;
  phone?: string;
}

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  country?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  userRecord: UserRecord | null;
  loading: boolean;
  walletAddress: string | null;
  signUp: (email: string, password: string, fullName: string, country: string, phone?: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signInWithOTP: (email: string) => Promise<AuthResponse>;
  verifyOTP: (email: string, token: string) => Promise<AuthResponse>;
  signInWithMagicLink: (email: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signInWithApple: () => Promise<AuthResponse>;
  signInWithFacebook: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRecord, setUserRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('Auth session check timed out');
      setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeoutId);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
          syncOAuthProfile(session.user);
        }
        setLoading(false);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('Auth session error:', error);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        if (_event === 'SIGNED_IN') {
          await syncOAuthProfile(session.user);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncOAuthProfile = async (user: User) => {
    const provider = user.app_metadata?.provider;
    if (provider && ['google', 'facebook', 'apple'].includes(provider)) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await supabase.functions.invoke('sync-oauth-profile', {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`
            }
          });
        }
      } catch (error) {
        // Profile sync failed - non-critical
      }
    }
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    
    const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
    setUserRecord(userData);
    if (userData?.wallet_address) {
      setWalletAddress(userData.wallet_address);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, country: string, phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            country: country
          }
        }
      });
      
      if (error) {
        if (error.message.includes('email') && error.message.includes('confirmation')) {
          return { 
            data, 
            error: { 
              ...error, 
              message: 'Account created but email confirmation could not be sent. Please try signing in or use OTP/Magic Link instead.' 
            } 
          };
        }
        return { data, error };
      }
      
      if (data.user) {
        await supabase.from('users').insert({ 
          id: data.user.id, 
          email, 
          phone: phone || null,
          full_name: fullName,
          country,
          email_verified: false
        }).catch(err => {
          console.warn('Failed to create user record:', err);
        });
      }
      return { data, error };
    } catch (err: any) {
      return { 
        data: { user: null, session: null }, 
        error: { message: err.message || 'Signup failed. Please try again.' } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithOTP = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    return { data, error };
  };

  const verifyOTP = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    return { data, error };
  };

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/wallet`,
        shouldCreateUser: true
      }
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/`
      },
    });
    return { data, error };
  };

  const signInWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { data, error };
  };

  const signInWithFacebook = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const updateProfile = async (data: any) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) await loadProfile(user.id);
    return { data: profile, error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      userRecord,
      loading,
      walletAddress,
      signUp,
      signIn,
      signInWithOTP,
      verifyOTP,
      signInWithMagicLink,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      signOut, 
      resetPassword, 
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
