// scripts/verify-auth-users.js
import { createClient } from '@supabase/supabase-js'

const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

async function verifyAuthUsers() {
  console.log('🔍 Verifying Auth Users in Dev Database...\n')

  try {
    // Try to check if we can access auth.users (this might fail)
    console.log('📊 Attempting to check auth.users...')
    
    // Since we can't access auth.users directly via REST API, let's test
    // by trying to insert a space with one of the known user IDs
    const testUserId = 'fc51da5e-30dd-42d9-bf53-a5fa42ae0193'
    
    const testSpace = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TEST_SPACE_DELETE_ME',
      created_by: testUserId
    }
    
    console.log(`🧪 Testing foreign key constraint with user: ${testUserId}`)
    
    const { error: insertError } = await devClient
      .from('spaces')
      .insert([testSpace])
    
    if (insertError) {
      if (insertError.code === '23503' && insertError.message.includes('not present in table "users"')) {
        console.log('❌ Auth users NOT created - foreign key constraint still failing')
        console.log('   Error:', insertError.message)
        console.log('\n💡 Solution: Please re-run the SQL in dev dashboard:')
        console.log('   https://supabase.com/dashboard/project/aajeyifqrupykjyapoft/sql')
        console.log('\n   SQL to run:')
        console.log(`   INSERT INTO auth.users (id, email, created_at) VALUES ('${testUserId}', 'placeholder-${testUserId}@example.com', NOW());`)
      } else {
        console.log('❌ Different error occurred:', insertError)
      }
    } else {
      console.log('✅ Auth user exists! Foreign key constraint passed.')
      
      // Clean up the test space
      await devClient.from('spaces').delete().eq('id', testSpace.id)
      console.log('✅ Test space cleaned up successfully')
      
      console.log('\n🎉 Auth users are ready for migration!')
    }
    
  } catch (err) {
    console.error('❌ Verification error:', err.message)
  }
}

verifyAuthUsers().catch(console.error)
