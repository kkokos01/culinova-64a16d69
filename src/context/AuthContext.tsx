
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  needsUsername: boolean;
  signUp: (email: string, password: string, userData?: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const { toast } = useToast();

  const checkUserHasUsername = async (userId: string) => {
    try {
      // Add a small delay to allow AuthCallback to save username from email verification
      // This prevents race condition where needsUsername check fires before username is saved
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("🔍 Checking username for user:", userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      console.log("🔍 Profile query result:", { profile, error: error?.message });
      
      const hasUsername = !!profile?.display_name;
      console.log("🔍 Username check result:", { hasUsername, displayName: profile?.display_name });
      
      setNeedsUsername(!hasUsername);
      return hasUsername;
    } catch (error) {
      console.error('Error checking username:', error);
      setNeedsUsername(true);
      return false;
    }
  };

  useEffect(() => {
    // Check if Supabase is properly configured before making requests
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkUserHasUsername(session.user.id);
        } else {
          setNeedsUsername(false);
        }
        setIsLoading(false);
      }).catch((error) => {
        console.error('Failed to get session:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Supabase client not properly configured:', error);
      setIsLoading(false);
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log("Auth state changed:", _event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only check username on SIGNED_IN events, not INITIAL_SESSION
        // This prevents race condition after email verification callback
        if (_event === 'SIGNED_IN' && session?.user) {
          await checkUserHasUsername(session.user.id);
        } else {
          setNeedsUsername(false);
        }
        
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      return () => {};
    }
  }, []);

  const signUp = async (email: string, password: string, userData?: Record<string, any>) => {
    setIsLoading(true);
    const redirectUrl = new URL('/auth/v1/callback', window.location.origin).toString();
    
    const signUpOptions: any = {
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    };
    
    // Add user data to metadata if provided
    if (userData) {
      signUpOptions.options.data = userData;
    }
    
    const { error } = await supabase.auth.signUp(signUpOptions);
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account",
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const isProduction = window.location.hostname !== 'localhost';
    // Updated to use a generic app URL instead of Lovable
    const redirectTo = isProduction 
      ? `https://culinova-six.vercel.app/auth/v1/callback`
      : `${window.location.origin}/auth/v1/callback`;
    
    console.log("Redirecting to:", redirectTo);
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Use timeout to prevent hanging on OAuth sessions
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );
      
      await Promise.race([signOutPromise, timeoutPromise]);
      
      setUser(null);
      setSession(null);
      setNeedsUsername(false);
      
      toast({ 
        title: "Signed out",
        description: "You have been successfully signed out"
      });
      
      // Navigate to home page after successful sign-out
      window.location.href = '/';
    } catch (error) {
      // Force local sign-out even if Supabase call fails or times out
      setUser(null);
      setSession(null);
      setNeedsUsername(false);
      
      toast({ 
        title: "Signed out",
        description: "You have been successfully signed out"
      });
      
      // Navigate to home page even if there was an error
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    // Update to use the v1 path for password reset as well
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setIsLoading(false);
    
    if (!error) {
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link",
      });
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    needsUsername,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
