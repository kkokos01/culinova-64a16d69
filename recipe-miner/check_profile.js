import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function checkProfile() {
  console.log('Checking user profile...')
  
  // Check if profile exists
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Profile data:', data)
  }
  
  // Check RLS policies
  const { data: policies, error: policyError } = await client
    .rpc('get_policies_for_table', { table_name: 'user_profiles' })
  
  if (policyError) {
    console.error('Policy error:', policyError)
  } else {
    console.log('RLS policies:', policies)
  }
}

checkProfile()
