import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function getAllUsers() {
  console.log('Fetching all users from dev database...\n')
  
  // Get all auth users
  const { data: authUsers, error: authError } = await client.auth.admin.listUsers()
  
  if (authError) {
    console.error('Auth users error:', authError)
    return
  }
  
  console.log('=== AUTH USERS ===')
  authUsers.users.forEach(user => {
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Created: ${user.created_at}`)
    console.log(`Last sign in: ${user.last_sign_in_at}`)
    console.log('---')
  })
  
  // Get all user profiles
  const { data: profiles, error: profileError } = await client
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (profileError) {
    console.error('\nProfile error:', profileError)
    return
  }
  
  console.log('\n=== USER PROFILES ===')
  profiles.forEach(profile => {
    console.log(`Profile ID: ${profile.id}`)
    console.log(`User ID: ${profile.user_id}`)
    console.log(`Display Name: ${profile.display_name}`)
    console.log(`Email: (not stored in profile)`)
    console.log(`Created: ${profile.created_at}`)
    console.log('---')
  })
  
  // Get space memberships
  const { data: spaces, error: spaceError } = await client
    .from('user_spaces')
    .select(`
      user_id,
      role,
      is_active,
      spaces:space_id (name, is_public)
    `)
    .order('created_at', { ascending: false })
  
  if (spaceError) {
    console.error('\nSpace error:', spaceError)
    return
  }
  
  console.log('\n=== SPACE MEMBERSHIPS ===')
  spaces.forEach(membership => {
    console.log(`User ID: ${membership.user_id}`)
    console.log(`Space: ${membership.spaces?.name || 'Unknown'}`)
    console.log(`Role: ${membership.role}`)
    console.log(`Active: ${membership.is_active}`)
    console.log('---')
  })
}

getAllUsers()
