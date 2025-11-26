// Auth Header Test - Check if Supabase includes Authorization headers
import { supabase } from '@/integrations/supabase/client';

export const testAuthHeaders = async () => {
  console.log('Testing Supabase auth headers...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return false;
    }
    
    if (!session) {
      console.warn('No session found');
      return false;
    }
    
    console.log('Session found:', session.user.id);
    console.log('Access token exists:', !!session.access_token);
    
    // Test a simple query that requires auth
    const { data, error } = await supabase
      .from('spaces')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Query error:', error);
      if (error.code === '406') {
        console.warn('406 error - likely missing Authorization header or RLS policy issue');
      }
      return false;
    }
    
    console.log('Query successful:', data);
    return true;
    
  } catch (err) {
    console.error('Test failed:', err);
    return false;
  }
};
