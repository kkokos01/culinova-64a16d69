// scripts/comprehensive-api-test.js
import { createClient } from '@supabase/supabase-js'

// Test different authentication methods for dev project
const devAnonClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.TYjxNXgv0WyfS34sJW13SpABZRu_Cja4NwRXP3FxKz8'
)

const devServiceClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
)

const prodServiceClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function comprehensiveTest() {
  console.log('🔍 Comprehensive API Diagnostic Test...\n')

  // Test 1: Production service role (control - should work)
  console.log('📡 Test 1: Production Service Role (Control)')
  try {
    const { data, error } = await prodServiceClient
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

  // Test 2: Dev anon key (basic API access)
  console.log('\n📡 Test 2: Dev Anon Key (Basic API Access)')
  try {
    const { data, error } = await devAnonClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Dev anon failed:', error)
    } else {
      console.log('✅ Dev anon works:', data)
    }
  } catch (err) {
    console.error('❌ Dev anon error:', err.message)
  }

  // Test 3: Dev service role (the problematic one)
  console.log('\n📡 Test 3: Dev Service Role (Problematic)')
  try {
    const { data, error } = await devServiceClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Dev service role failed:', error)
    } else {
      console.log('✅ Dev service role works:', data)
    }
  } catch (err) {
    console.error('❌ Dev service role error:', err.message)
  }

  // Test 4: Try a different table with dev service role
  console.log('\n📡 Test 4: Dev Service Role (Different Table)')
  try {
    const { data, error } = await devServiceClient
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Dev service role (user_profiles) failed:', error)
    } else {
      console.log('✅ Dev service role (user_profiles) works:', data)
    }
  } catch (err) {
    console.error('❌ Dev service role (user_profiles) error:', err.message)
  }

  console.log('\n🎯 Analysis:')
  console.log('- If anon works but service_role fails: Service role key issue')
  console.log('- If both fail: Dev project API access issue')
  console.log('- If only production works: Regional/network issue')
}

comprehensiveTest().catch(console.error)
