import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function findAndUpdateProfile() {
  console.log('Finding existing profile with display_name "chefkoko"...')
  
  // Find the existing profile
  const { data: existing, error: findError } = await client
    .from('user_profiles')
    .select('*')
    .eq('display_name', 'chefkoko')
  
  if (findError) {
    console.error('Find error:', findError)
    return
  }
  
  console.log('Found existing profiles:', existing)
  
  if (existing && existing.length > 0) {
    // Update the existing profile to use the correct user_id
    const { data: updated, error: updateError } = await client
      .from('user_profiles')
      .update({ 
        user_id: '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
        updated_at: new Date().toISOString()
      })
      .eq('id', existing[0].id)
      .select()
    
    if (updateError) {
      console.error('Update error:', updateError)
    } else {
      console.log('Updated profile:', updated)
    }
  } else {
    // Create new profile with a unique display name
    const { data, error } = await client
      .from('user_profiles')
      .insert({
        user_id: '3a9d183d-24d4-4cb6-aaf0-38635aa47c26',
        display_name: 'chefkoko-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('Insert error:', error)
    } else {
      console.log('Created new profile:', data)
    }
  }
  
  // Final verification
  const { data: verify, error: verifyError } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', '3a9d183d-24d4-4cb6-aaf0-38635aa47c26')
  
  if (verifyError) {
    console.error('Verify error:', verifyError)
  } else {
    console.log('Final verification - profile exists:', verify)
  }
}

findAndUpdateProfile()
