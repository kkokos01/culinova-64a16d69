// scripts/test-supabase-connection.js
import { createClient } from '@supabase/supabase-js'

// Production Supabase client (REST API)
const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

// Development Supabase client (REST API)
const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhamV5aWZxcnVweWtqeWFwb2Z0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIzMzMyNjQsImV4cCI6MjA4MDgwOTI2NH0.wYw65TFgOl_YxQFnAJ9HbTL1VBVAgwhn_0jjOVcdmEM'
)

async function testConnections() {
  console.log('🧪 Testing Supabase REST API Connections...\n')

  // Test production connection
  console.log('📡 Testing Production Connection...')
  try {
    const { data, error } = await prodClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Production connection failed:', error)
    } else {
      console.log('✅ Production connection successful')
      console.log(`   Sample data: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    console.error('❌ Production connection error:', err.message)
  }

  // Test development connection
  console.log('\n📡 Testing Development Connection...')
  try {
    const { data, error } = await devClient
      .from('spaces')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Development connection failed:', error)
    } else {
      console.log('✅ Development connection successful')
      console.log(`   Sample data: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    console.error('❌ Development connection error:', err.message)
  }

  console.log('\n🎯 If both connections work, we can proceed with migration!')
}

testConnections().catch(console.error)
