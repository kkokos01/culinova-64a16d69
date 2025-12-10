import { createClient } from '@supabase/supabase-js';

// Test with dev anon key instead of service role
const devConfig = {
  url: 'https://aajeyifqrupykjyapoft.supabase.co', 
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.TYjxNXgv0WyfS34sJW13SpABZRu_Cja4NwRXP3FxKz8' // This is the anon key
};

async function testDevAnonKey() {
  console.log('Testing dev ANON key for reads...');
  
  const client = createClient(devConfig.url, devConfig.serviceKey);
  
  try {
    const { data, error } = await client
      .from('spaces')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Anon key read failed:', error);
    } else {
      console.log('✅ Anon key can read from dev');
      console.log('Anon key works for reads but service_role fails - this means the service_role key is wrong');
    }
  } catch (err) {
    console.error('Anon key exception:', err);
  }
}

testDevAnonKey().catch(console.error);
