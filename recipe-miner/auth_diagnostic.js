// Paste this in the browser console on the Collections page
// This will tell us exactly what's happening with authentication

console.log('=== Authentication Diagnostic ===');

// 1. Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);

if (session) {
  console.log('✅ User is authenticated');
  console.log('User ID:', session.user.id);
  console.log('User email:', session.user.email);
  
  // 2. Check if this user has spaces
  const { data: userSpaces, error: spacesError } = await supabase
    .from("user_spaces")
    .select("*")
    .eq("is_active", true)
    .eq("user_id", session.user.id);
    
  console.log('User spaces for authenticated user:', userSpaces?.length || 0);
  console.log('Spaces error:', spacesError);
  
  // 3. Compare with test user ID
  const testUserId = '3a9d183d-24d4-4cb6-aaf0-38635aa47c26';
  console.log('Is user the test user?', session.user.id === testUserId);
  
  if (session.user.id !== testUserId) {
    console.log('⚠️ You are logged in as a different user than expected');
    console.log('Expected:', testUserId);
    console.log('Actual:', session.user.id);
  }
} else {
  console.log('❌ No session - user is not logged in');
  console.log('Checking localStorage...');
  const token = localStorage.getItem('culinova-supabase-auth-token');
  console.log('Token in localStorage:', token ? 'exists' : 'missing');
}

// 4. Check which Supabase URL we're connected to
console.log('Supabase URL:', supabase.supabaseUrl);
