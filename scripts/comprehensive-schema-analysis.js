// scripts/comprehensive-schema-analysis.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function analyzeProductionSchema() {
  console.log('🔍 COMPREHENSIVE PRODUCTION SCHEMA ANALYSIS\n')

  // Step 1: Get all tables with row counts
  console.log('📊 PRODUCTION TABLES WITH ROW COUNTS:')
  try {
    const { data: tables, error } = await prodClient
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .order('tablename')
    
    if (error) {
      console.error('❌ Failed to get tables:', error)
      return
    }

    for (const table of tables) {
      const { count, error: countError } = await prodClient
        .from(table.tablename)
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.log(`  ❌ ${table.tablename}: ERROR - ${countError.message}`)
      } else {
        console.log(`  ✅ ${table.tablename}: ${count} rows`)
      }
    }
  } catch (err) {
    console.error('❌ Table analysis error:', err.message)
  }

  // Step 2: Get foreign key relationships
  console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:')
  try {
    // Get foreign key constraints for key tables
    const keyTables = ['spaces', 'user_spaces', 'space_invitations', 'recipes', 'recipe_versions']
    
    for (const tableName of keyTables) {
      console.log(`\n  📋 ${tableName}:`)
      
      // Get sample data to understand relationships
      const { data: sampleData, error: sampleError } = await prodClient
        .from(tableName)
        .select('*')
        .limit(3)
      
      if (sampleError) {
        console.log(`    ❌ Failed to get sample: ${sampleError.message}`)
        continue
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log(`    📄 Sample data structure:`)
        const firstRecord = sampleData[0]
        Object.keys(firstRecord).forEach(key => {
          const value = firstRecord[key]
          const type = typeof value
          const isUUID = type === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
          console.log(`      ${key}: ${type}${isUUID ? ' (UUID - likely foreign key)' : ''}`)
        })
      }
    }
  } catch (err) {
    console.error('❌ Foreign key analysis error:', err.message)
  }

  // Step 3: Get auth user dependencies
  console.log('\n👤 AUTH USER DEPENDENCIES:')
  try {
    // Get all unique user IDs referenced in spaces
    const { data: spaceCreators, error: creatorsError } = await prodClient
      .from('spaces')
      .select('created_by')
    
    if (creatorsError) {
      console.error('❌ Failed to get space creators:', creatorsError)
    } else {
      const uniqueCreators = [...new Set(spaceCreators?.map(s => s.created_by) || [])]
      console.log(`  📊 Spaces reference ${uniqueCreators.length} unique auth users`)
      uniqueCreators.slice(0, 5).forEach((creatorId, i) => {
        console.log(`    ${i+1}. ${creatorId}`)
      })
      if (uniqueCreators.length > 5) {
        console.log(`    ... and ${uniqueCreators.length - 5} more`)
      }
    }

    // Get user IDs from user_profiles
    const { data: profileUsers, error: profilesError } = await prodClient
      .from('user_profiles')
      .select('user_id')
    
    if (profilesError) {
      console.error('❌ Failed to get profile users:', profilesError)
    } else {
      const uniqueProfileUsers = [...new Set(profileUsers?.map(p => p.user_id) || [])]
      console.log(`  📊 User_profiles reference ${uniqueProfileUsers.length} unique auth users`)
    }

    // Get user IDs from user_spaces
    const { data: spaceUsers, error: spaceUsersError } = await prodClient
      .from('user_spaces')
      .select('user_id')
    
    if (spaceUsersError) {
      console.error('❌ Failed to get space users:', spaceUsersError)
    } else {
      const uniqueSpaceUsers = [...new Set(spaceUsers?.map(s => s.user_id) || [])]
      console.log(`  📊 User_spaces reference ${uniqueSpaceUsers.length} unique auth users`)
    }
  } catch (err) {
    console.error('❌ Auth dependency analysis error:', err.message)
  }

  // Step 4: Migration dependency order
  console.log('\n📋 RECOMMENDED MIGRATION ORDER:')
  console.log('  1️⃣  auth.users (placeholder creation)')
  console.log('  2️⃣  spaces (depends on auth.users)')
  console.log('  3️⃣  user_profiles (depends on auth.users)')
  console.log('  4️⃣  user_spaces (depends on spaces + user_profiles)')
  console.log('  5️⃣  space_invitations (depends on spaces + user_profiles)')
  console.log('  6️⃣  recipes (depends on spaces + auth.users)')
  console.log('  7️⃣  recipe_versions (depends on recipes)')
  console.log('  8️⃣  ingredients (depends on recipes)')
  console.log('  9️⃣  pantry_items (depends on auth.users)')
  console.log('  🔟 shopping_list_items (depends on auth.users)')

  console.log('\n🎯 KEY INSIGHTS:')
  console.log('  • All tables reference auth.users for user ownership')
  console.log('  • Spaces must be migrated before dependent tables')
  console.log('  • Auth users must exist before any table migration')
  console.log('  • Foreign key constraints must be handled properly')
}

analyzeProductionSchema().catch(console.error)
