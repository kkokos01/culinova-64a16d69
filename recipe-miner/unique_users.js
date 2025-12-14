import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function getUniqueUsers() {
  console.log('=== UNIQUE USERS IN DEV DATABASE ===\n')
  
  // Get unique user profiles
  const { data: profiles, error: profileError } = await client
    .from('user_profiles')
    .select('user_id, display_name, created_at')
    .order('created_at', { ascending: false })
  
  if (profileError) {
    console.error('Error:', profileError)
    return
  }
  
  // Get auth users for emails
  const { data: authUsers, error: authError } = await client.auth.admin.listUsers()
  
  if (authError) {
    console.error('Auth error:', authError)
    return
  }
  
  // Combine data
  profiles.forEach(profile => {
    const authUser = authUsers.users.find(u => u.id === profile.user_id)
    console.log(`User ID: ${profile.user_id}`)
    console.log(`Email: ${authUser?.email || 'Not found'}`)
    console.log(`Display Name: ${profile.display_name}`)
    console.log(`Created: ${profile.created_at}`)
    console.log('---')
  })
  
  console.log(`\nTotal unique users: ${profiles.length}`)
}

getUniqueUsers()
