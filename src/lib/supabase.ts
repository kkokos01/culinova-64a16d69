
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// For development/testing purposes only - replace with your actual Supabase credentials when deploying
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQwMTYwMCwiZXhwIjoxOTMyMDM3NjAwfQ.placeholder';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
