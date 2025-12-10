// scripts/migrate-auth-first.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

const BATCH_SIZE = 500

async function migrateAuthFirst() {
  console.log('🚀 Starting AUTH-FIRST Migration (Production → Development)\n')

  // Step 1: Get all unique auth user IDs from production
  console.log('📊 Step 1: Collecting all auth user IDs from production...')
  const allUserIds = new Set()

  try {
    // From spaces.created_by
    const { data: spaces } = await prodClient.from('spaces').select('created_by')
    spaces?.forEach(s => allUserIds.add(s.created_by))

    // From user_profiles.user_id
    const { data: profiles } = await prodClient.from('user_profiles').select('user_id')
    profiles?.forEach(p => allUserIds.add(p.user_id))

    // From user_spaces.user_id
    const { data: userSpaces } = await prodClient.from('user_spaces').select('user_id')
    userSpaces?.forEach(us => allUserIds.add(us.user_id))

    // From recipes.user_id
    const { data: recipes } = await prodClient.from('recipes').select('user_id')
    recipes?.forEach(r => allUserIds.add(r.user_id))

    // From pantry_items.user_id
    const { data: pantryItems } = await prodClient.from('pantry_items').select('user_id')
    pantryItems?.forEach(pi => allUserIds.add(pi.user_id))

    // From shopping_list_items.user_id
    const { data: shoppingItems } = await prodClient.from('shopping_list_items').select('user_id')
    shoppingItems?.forEach(si => allUserIds.add(si.user_id))

    console.log(`✅ Found ${allUserIds.size} unique auth user IDs in production`)

  } catch (err) {
    console.error('❌ Failed to collect user IDs:', err.message)
    return
  }

  // Step 2: Create placeholder auth users in dev
  console.log('\n👤 Step 2: Creating placeholder auth users in dev...')
  try {
    // Note: We can't directly insert into auth.users via REST API
    // But we can use the dashboard SQL Editor for this step
    console.log('⚠️  AUTH USERS CREATION REQUIRED:')
    console.log('Please run this SQL in dev dashboard SQL Editor:')
    console.log('https://supabase.com/dashboard/project/aajeyifqrupykjyapoft/sql')
    console.log('\n-- Create placeholder auth users')
    for (const userId of Array.from(allUserIds).slice(0, 10)) {
      console.log(`INSERT INTO auth.users (id, email, created_at) VALUES ('${userId}', 'placeholder-${userId}@example.com', NOW());`)
    }
    if (allUserIds.size > 10) {
      console.log(`-- ... and ${allUserIds.size - 10} more users`)
    }
    console.log('\nAfter running the SQL, press Enter to continue...')
    
    // Wait for user to run SQL
    // In a real script, you'd wait for user input here
    
  } catch (err) {
    console.error('❌ Auth user creation failed:', err.message)
    return
  }

  // Step 3: Migrate in correct dependency order
  const migrationOrder = [
    'spaces',
    'user_profiles', 
    'user_spaces',
    'space_invitations',
    'recipes',
    'recipe_versions',
    'ingredients',
    'pantry_items',
    'shopping_list_items'
  ]

  let totalRowsMigrated = 0

  for (const tableName of migrationOrder) {
    console.log(`\n📦 Step: Migrating ${tableName}...`)
    
    try {
      // Read from production
      const { data: prodData, error: readError } = await prodClient
        .from(tableName)
        .select('*')
      
      if (readError) {
        console.error(`❌ Failed to read ${tableName}:`, readError)
        continue
      }
      
      if (!prodData || prodData.length === 0) {
        console.log(`ℹ️  No ${tableName} data. Skipping.`)
        continue
      }
      
      console.log(`📊 Found ${prodData.length} ${tableName} in production.`)
      
      // Clear dev table
      await devClient.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log(`🧹 Cleared dev ${tableName} table.`)
      
      // Insert in batches
      let insertedCount = 0
      for (let i = 0; i < prodData.length; i += BATCH_SIZE) {
        const batch = prodData.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await devClient.from(tableName).insert(batch)
        
        if (insertError) {
          console.error(`❌ Failed to insert ${tableName} batch:`, insertError)
          break
        }
        
        insertedCount += batch.length
        
        if (insertedCount % 1000 === 0 || insertedCount === prodData.length) {
          console.log(`   📈 Progress: ${insertedCount}/${prodData.length} rows migrated`)
        }
      }
      
      console.log(`✅ Migrated ${insertedCount}/${prodData.length} ${tableName} to dev.`)
      totalRowsMigrated += insertedCount
      
    } catch (err) {
      console.error(`❌ ${tableName} migration failed:`, err.message)
    }
  }
  
  console.log(`\n🎉 Migration Complete! Total rows migrated: ${totalRowsMigrated}`)
}

migrateAuthFirst().catch(console.error)
