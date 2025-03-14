
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const supabase = createClient<Database>(
  "https://zujlsbkxxsmiiwgyodph.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MjU3OTgsImV4cCI6MjA1NzUwMTc5OH0.sUuM7V1rESlwZPAr_4rzQMVlPh54GDSTolPGtrZA3kY"
);
