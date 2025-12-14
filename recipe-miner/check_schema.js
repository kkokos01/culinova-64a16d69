import { createClient } from '@supabase/supabase-js'

const client = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function checkSchema() {
  console.log('Checking schema in production...')
  
  // Test basic query without joins
  console.log('\n1. Testing basic query...')
  const { data: basic, error: basicError } = await client
    .from('recipes')
    .select('id, title, qa_status, user_id, space_id')
    .in('qa_status', ['pending', 'flag'])
    .limit(2)
  
  if (basicError) {
    console.error('Basic query failed:', basicError)
    return
  }
  
  console.log('✅ Basic query works')
  console.log('Sample recipes:', basic)
  
  // Check if we can access user_profiles
  console.log('\n2. Checking user_profiles table...')
  const { data: profiles, error: profileError } = await client
    .from('user_profiles')
    .select('user_id, display_name')
    .limit(1)
  
  if (profileError) {
    console.error('Cannot access user_profiles:', profileError)
  } else {
    console.log('✅ user_profiles accessible')
  }
  
  // Check if we can access spaces
  console.log('\n3. Checking spaces table...')
  const { data: spaces, error: spaceError } = await client
    .from('spaces')
    .select('id, name')
    .limit(1)
  
  if (spaceError) {
    console.error('Cannot access spaces:', spaceError)
  } else {
    console.log('✅ spaces accessible')
  }
  
  // Test the join query that's failing
  console.log('\n4. Testing join query...')
  const { data: joinData, error: joinError } = await client
    .from('recipes')
    .select('id, user_profiles!recipes_user_id_fkey(display_name)')
    .in('qa_status', ['pending', 'flag'])
    .limit(1)
  
  if (joinError) {
    console.error('❌ Join query failed:', joinError)
    console.log('\nThe foreign key constraint "recipes_user_id_fkey" does not exist in production')
    console.log('This is why the RecipeReview page is failing')
  } else {
    console.log('✅ Join query works')
  }
  
  // Check what foreign keys exist
  console.log('\n5. Checking for existing foreign keys...')
  try {
    const { data: fkData } = await client
      .from('recipes')
      .select('*')
      .limit(1)
    
    console.log('Recipes table structure check complete')
  } catch (e) {
    console.error('Error:', e)
  }
}

checkSchema()
