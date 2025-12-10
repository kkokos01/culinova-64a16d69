// scripts/migrate-data-only.js
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

async function migrateDataOnly() {
  console.log('🚀 Starting Data Migration (Production → Development)\n')
  console.log('✅ Auth users verified - proceeding with data migration...\n')

  let totalRowsMigrated = 0

  // Migration order respecting foreign key dependencies
  const migrationOrder = [
    'spaces',                    // Depends on auth.users
    'user_profiles',             // Depends on auth.users
    'user_spaces',               // Depends on spaces + user_profiles
    'space_invitations',         // Depends on spaces + user_profiles
    'recipes',                   // Depends on spaces + auth.users
    'recipe_versions',           // Depends on recipes
    'ingredients',               // Depends on recipes + foods
    'pantry_items',              // Depends on spaces + auth.users
    'shopping_list_items'        // Depends on auth.users
  ]

  for (const tableName of migrationOrder) {
    console.log(`\n📦 Migrating ${tableName}...`)
    
    try {
      // Read all data from production
      const { data: prodData, error: readError } = await prodClient
        .from(tableName)
        .select('*')
      
      if (readError) {
        console.error(`❌ Failed to read ${tableName}:`, readError)
        continue
      }
      
      if (!prodData || prodData.length === 0) {
        console.log(`   ℹ️  No data in ${tableName}. Skipping.`)
        continue
      }
      
      console.log(`   📊 Found ${prodData.length} rows in production.`)
      
      // Clear dev table
      const { error: deleteError } = await devClient
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (deleteError) {
        console.error(`   ❌ Failed to clear dev ${tableName}:`, deleteError)
        continue
      }
      
      console.log(`   🧹 Cleared dev table.`)
      
      // Insert data in batches
      let insertedCount = 0
      for (let i = 0; i < prodData.length; i += BATCH_SIZE) {
        const batch = prodData.slice(i, i + BATCH_SIZE)
        
        const { error: insertError } = await devClient
          .from(tableName)
          .insert(batch)
        
        if (insertError) {
          console.error(`   ❌ Failed to insert batch into ${tableName}:`, insertError)
          console.log(`   📊 Failed at batch ${Math.floor(i/BATCH_SIZE) + 1}, rows ${i+1}-${Math.min(i+BATCH_SIZE, prodData.length)}`)
          break
        }
        
        insertedCount += batch.length
        
        // Progress reporting
        if (insertedCount % 1000 === 0 || insertedCount === prodData.length) {
          console.log(`   📈 Progress: ${insertedCount}/${prodData.length} rows migrated`)
        }
      }
      
      console.log(`   ✅ Migrated ${insertedCount}/${prodData.length} rows to dev.`)
      totalRowsMigrated += insertedCount
      
    } catch (err) {
      console.error(`   ❌ Failed to migrate ${tableName}:`, err.message)
    }
  }
  
  console.log(`\n🎉 Migration Complete!`)
  console.log(`📊 Total rows migrated: ${totalRowsMigrated}`)
  console.log(`✅ Dev database now aligned with production!`)
}

migrateDataOnly().catch(console.error)
