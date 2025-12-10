import { createClient } from '@supabase/supabase-js';

// Test the dev service role key with a simple operation
const devConfig = {
  url: 'https://aajeyifqrupykjyapoft.supabase.co', 
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
};

async function testDevKey() {
  console.log('Testing dev service role key...');
  
  const client = createClient(devConfig.url, devConfig.serviceKey);
  
  // Test 1: Simple read operation
  console.log('Test 1: Reading from spaces table...');
  try {
    const { data, error } = await client
      .from('spaces')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Read failed:', error);
    } else {
      console.log('✅ Read operation successful');
    }
  } catch (err) {
    console.error('Read exception:', err);
  }
  
  // Test 2: Simple insert operation (create a test record)
  console.log('Test 2: Inserting test record...');
  try {
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TEST_DELETE_ME',
      created_by: '00000000-0000-0000-0000-000000000001'
    };
    
    const { data, error } = await client
      .from('spaces')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('Insert failed:', error);
    } else {
      console.log('✅ Insert operation successful');
      
      // Clean up the test record
      await client
        .from('spaces')
        .delete()
        .eq('id', testData.id);
      
      console.log('✅ Cleanup successful');
    }
  } catch (err) {
    console.error('Insert exception:', err);
  }
  
  // Test 3: Check RLS status
  console.log('Test 3: Checking RLS policies...');
  try {
    const { data, error } = await client
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'spaces');
    
    if (error) {
      console.error('RLS check failed:', error);
    } else {
      console.log(`Found ${data.length} RLS policies on spaces table`);
      data.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
      });
    }
  } catch (err) {
    console.error('RLS check exception:', err);
  }
}

testDevKey().catch(console.error);
