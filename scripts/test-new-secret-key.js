// scripts/test-new-secret-key.js
import { createClient } from '@supabase/supabase-js'

// Test the new Secret Key format
const devSecretClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

// Production service role (control - should still work)
const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function testNewSecretKey() {
  console.log('🧪 Testing New Secret Key Format...\n')

  // Test 1: Production service role (control)
  console.log('📡 Test 1: Production Service Role (Control)')
  try {
    const { data, error } = await prodClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Production failed:', error)
    } else {
      console.log('✅ Production works:', data)
    }
  } catch (err) {
    console.error('❌ Production error:', err.message)
  }

  // Test 2: New Secret Key - Read operation
  console.log('\n📡 Test 2: New Secret Key - Read Operation')
  try {
    const { data, error } = await devSecretClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ New Secret Key (read) failed:', error)
    } else {
      console.log('✅ New Secret Key (read) works:', data)
    }
  } catch (err) {
    console.error('❌ New Secret Key (read) error:', err.message)
  }

  // Test 3: New Secret Key - Write operation (test insert/delete)
  console.log('\n📡 Test 3: New Secret Key - Write Operation')
  try {
    // Try to insert a test record
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TEST_DELETE_ME',
      created_by: '00000000-0000-0000-0000-000000000001'
    }
    
    const { data: insertData, error: insertError } = await devSecretClient
      .from('spaces')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ New Secret Key (write) failed:', insertError)
    } else {
      console.log('✅ New Secret Key (write) works:', insertData)
      
      // Clean up the test record
      await devSecretClient
        .from('spaces')
        .delete()
        .eq('id', testData.id)
      
      console.log('✅ Test record cleaned up successfully')
    }
  } catch (err) {
    console.error('❌ New Secret Key (write) error:', err.message)
  }

  console.log('\n🎯 If the new Secret Key works for both read and write, we can proceed with migration!')
}

testNewSecretKey().catch(console.error)
