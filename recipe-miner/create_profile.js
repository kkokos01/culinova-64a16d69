import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function createProfile() {
  console.log('Creating user profile...')
  
  // First delete any existing wrong records
  const { error: deleteError } = await client
    .from('user_profiles')
    .delete()
    .eq('id', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26')
  
  if (deleteError) {
    console.log('Delete error (might be expected):', deleteError.message)
  }
  
  // Create the correct record
  const { data, error } = await client
    .from('user_profiles')
    .insert({
      user_id: '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
      display_name: 'chefkoko',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
  
  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('Created profile:', data)
  }
  
  // Verify it was created
  const { data: verify, error: verifyError } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26')
  
  if (verifyError) {
    console.error('Verify error:', verifyError)
  } else {
    console.log('Verified profile exists:', verify)
  }
}

createProfile()
