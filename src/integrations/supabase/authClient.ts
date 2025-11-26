// Custom Supabase client wrapper with proper auth session handling
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create client with full auth session persistence
export const supabaseAuth = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  }
});

// Function to get authenticated client for API calls
export const getAuthenticatedClient = async () => {
  const { data: { session }, error } = await supabaseAuth.auth.getSession();
  
  if (error || !session) {
    console.warn('No active session found');
    return supabaseAuth;
  }
  
  // Return client with explicit auth header
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

// Default export for backward compatibility
export const supabase = supabaseAuth;
