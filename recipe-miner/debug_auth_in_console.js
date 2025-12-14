// Add this to the browser console when on the Collections page
// to check if the user is authenticated

// Check Supabase session
import { supabase } from '@/integrations/supabase/client';

console.log('=== Authentication Debug ===');
console.log('Current user:', supabase.auth.user());
console.log('Current session:', await supabase.auth.getSession());

// Test the exact query SpaceContext makes
const { data, error } = await supabase
  .from("user_spaces")
  .select("*")
  .eq("is_active", true)
  .eq("user_id", "3a9d183d-24d4-4cb6-aaf0-38635aa47c26");

console.log('user_spaces query result:', { data, error });
console.log('Rows returned:', data?.length || 0);

// If data is empty, check if we're authenticated
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  console.error('❌ No active session - user is not logged in!');
} else {
  console.log('✅ User is authenticated as:', session.user.email);
}
