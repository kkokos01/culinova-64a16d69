import { createClient } from '@supabase/supabase-js'

const client = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function checkForeignKeys() {
  console.log('Checking foreign key relationships in production...')
  
  // Check foreign keys on recipes table using direct SQL
  const { data: constraints, error: constraintError } = await client
    .from('information_schema.table_constraints')
    .select('constraint_name, constraint_type')
    .eq('table_name', 'recipes')
    .eq('constraint_type', 'FOREIGN KEY')
  
  if (constraintError) {
    console.error('Error checking constraints:', constraintError)
    return
  }
  
  console.log('Foreign key constraints on recipes table:', constraints)
  
  // Check key column usage for foreign keys
  const { data: keyUsage, error: keyError } = await client
    .from('information_schema.key_column_usage')
    .select('constraint_name, column_name')
    .eq('table_name', 'recipes')
    
  if (keyError) {
    console.error('Error checking key usage:', keyError)
  } else {
    console.log('Key column usage:', keyUsage)
  }
  
  // Check if user_profiles and spaces tables exist
  const { data: tables } = await client
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['user_profiles', 'spaces'])
  
  console.log('Required tables exist:', tables)
  
  // Check columns in recipes table
  const { data: columns } = await client
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'recipes')
    .in('column_name', ['user_id', 'space_id'])
  
  console.log('Recipes has user_id and space_id columns:', columns)
  
  // Test the actual query that's failing
  console.log('\nTesting the failing query...')
  const { data: test, error: testError } = await client
    .from('recipes')
    .select('id, qa_status')
    .in('qa_status', ['pending', 'flag'])
    .limit(1)
  
  if (testError) {
    console.error('Basic query failed:', testError)
  } else {
    console.log('Basic query works, testing join...')
    
    const { data: joinTest, error: joinError } = await client
      .from('recipes')
      .select('id, user_profiles!inner(display_name)')
      .in('qa_status', ['pending', 'flag'])
      .limit(1)
    
    if (joinError) {
      console.error('Join query failed:', joinError)
      console.log('This suggests the foreign key relationship does not exist')
    } else {
      console.log('Join query works:', joinTest)
    }
  }
}

checkForeignKeys()
