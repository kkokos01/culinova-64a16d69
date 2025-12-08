
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

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
      // Database triggers handle username creation atomically - no delay needed
      logger.debug("Checking username for user", userId, "AuthContext");
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      logger.debug("Profile query result", { profile, error: error?.message }, "AuthContext");
      
      const hasUsername = !!profile?.display_name;
      logger.debug("Username check result", { hasUsername, displayName: profile?.display_name }, "AuthContext");
      
      setNeedsUsername(!hasUsername);
      return hasUsername;
    } catch (error) {
      logger.error('Error checking username', error, "AuthContext");
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
    
    // 1. SMART CLEANUP: Find and remove the actual Supabase token
    // Supabase keys start with 'sb-' and end with '-auth-token'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear the specific session storage if used
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        sessionStorage.removeItem(key);
      }
    });

    // 2. Clear React State Immediately (Updates UI to "Signed Out" state)
    setUser(null);
    setSession(null);
    setNeedsUsername(false);
    
    try {
      // 3. Tell Supabase server to kill the session
      await supabase.auth.signOut();
    } catch (error) {
      // Non-critical error logging
      logger.debug("Supabase signOut failed (non-critical)", error, "AuthContext");
    } finally {
      setIsLoading(false);
      toast({ 
        title: "Signed out",
        description: "You have been successfully signed out"
      });
      
      // 4. SOFT REDIRECT: Let React Router handle the transition
      // The ProtectedRoute component will automatically detect user=null 
      // and redirect to /sign-in without a page reload.
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
