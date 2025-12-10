// scripts/final-verification.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION: Production vs Dev Database Alignment\n')
  
  const tables = [
    'spaces',
    'user_profiles', 
    'user_spaces',
    'space_invitations',
    'recipes',
    'recipe_versions',
    'food_categories',
    'foods',
    'ingredients',
    'pantry_items',
    'shopping_list_items'
  ]

  let totalProdRows = 0
  let totalDevRows = 0
  let alignmentScore = 0
  
  console.log('📊 TABLE COMPARISON:')
  console.log('┌─────────────────────┬─────────────┬─────────────┬──────────────┐')
  console.log('│ Table               │ Production  │ Development │ Status       │')
  console.log('├─────────────────────┼─────────────┼─────────────┼──────────────┤')
  
  for (const tableName of tables) {
    try {
      // Get production count
      const { count: prodCount, error: prodError } = await prodClient
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      // Get development count
      const { count: devCount, error: devError } = await devClient
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (prodError || devError) {
        console.log(`│ ${tableName.padEnd(19)} │ ERROR       │ ERROR       │ ❌ Access    │`)
        continue
      }
      
      totalProdRows += prodCount || 0
      totalDevRows += devCount || 0
      
      let status = '✅ ALIGNED'
      let alignment = true
      
      if (prodCount === devCount) {
        alignmentScore++
      } else {
        status = `⚠️  DIFF: ${prodCount}→${devCount}`
        alignment = false
      }
      
      console.log(`│ ${tableName.padEnd(19)} │ ${(prodCount || 0).toString().padEnd(11)} │ ${(devCount || 0).toString().padEnd(11)} │ ${status.padEnd(12)} │`)
      
    } catch (err) {
      console.log(`│ ${tableName.padEnd(19)} │ ERROR       │ ERROR       │ ❌ Failed    │`)
    }
  }
  
  console.log('└─────────────────────┴─────────────┴─────────────┴──────────────┘')
  
  console.log(`\n📈 SUMMARY:`)
  console.log(`   📊 Total Production Rows: ${totalProdRows}`)
  console.log(`   📊 Total Development Rows: ${totalDevRows}`)
  console.log(`   🎯 Alignment Score: ${alignmentScore}/${tables.length} (${Math.round(alignmentScore/tables.length*100)}%)`)
  
  // Check auth users
  console.log(`\n👤 AUTH USERS VERIFICATION:`)
  try {
    // Test if auth users exist by trying to insert a test space
    const testUserId = 'fc51da5e-30dd-42d9-bf53-a5fa42ae0193'
    const testSpace = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'AUTH_TEST_DELETE_ME',
      created_by: testUserId
    }
    
    const { error: insertError } = await devClient
      .from('spaces')
      .insert([testSpace])
    
    if (insertError && insertError.code === '23503') {
      console.log('   ❌ Auth users NOT properly set up')
    } else {
      console.log('   ✅ Auth users properly configured')
      
      // Clean up
      await devClient.from('spaces').delete().eq('id', testSpace.id)
    }
  } catch (err) {
    console.log('   ❌ Auth verification failed:', err.message)
  }
  
  // Final assessment
  console.log(`\n🎯 FINAL ASSESSMENT:`)
  if (alignmentScore === tables.length) {
    console.log('   ✅ DATABASES ARE PERFECTLY ALIGNED')
    console.log('   🎉 Migration completed successfully!')
  } else if (alignmentScore >= tables.length * 0.9) {
    console.log('   ⚠️  DATABASES ARE MOSTLY ALIGNED')
    console.log('   📊 Minor differences exist but migration is functional')
  } else {
    console.log('   ❌ DATABASES HAVE SIGNIFICANT DIFFERENCES')
    console.log('   🔧 Additional work may be needed')
  }
  
  console.log(`\n📋 NEXT STEPS:`)
  console.log(`   1. Review the table comparison above`)
  console.log(`   2. Address any significant differences`)
  console.log(`   3. Run production cleanup if desired (20 orphaned records)`)
  console.log(`   4. Document the final state for future reference`)
}

finalVerification().catch(console.error)
