
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This is a placeholder file that will be replaced by Lovable's Supabase integration
// When you connect Supabase through the Lovable UI, this will be automatically configured
export const supabase = createClient<Database>(
  'https://placeholder-url.supabase.co',
  'placeholder-key'
);

// NOTE: After connecting Supabase in the Lovable UI, you will need to restart your app
// This file will be automatically updated with the correct credentials
