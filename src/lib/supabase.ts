
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Real Supabase project credentials
const supabaseUrl = 'https://zujlsbkxxsmiiwgyodph.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MjU3OTgsImV4cCI6MjA1NzUwMTc5OH0.sUuM7V1rESlwZPAr_4rzQMVlPh54GDSTolPGtrZA3kY';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
