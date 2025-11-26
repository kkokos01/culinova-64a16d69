// Force Auth Headers - Aggressive Session Fix
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create client with aggressive auth session handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'culinova-supabase-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'culinova-web-app'
    }
  }
});

// Force session retrieval function
export const ensureAuthSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
    
    if (!session) {
      console.warn('No active session found');
      return null;
    }
    
    console.log('Session found for user:', session.user.id);
    return session;
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
};

// Wrapper for authenticated API calls
export const authenticatedRequest = async (requestFn: () => Promise<any>) => {
  const session = await ensureAuthSession();
  
  if (!session) {
    throw new Error('No active session - please log in again');
  }
  
  return requestFn();
};
