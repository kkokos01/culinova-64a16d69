// scripts/migrate-supabase.js
import { createClient } from '@supabase/supabase-js'

// Production Supabase client (REST API)
const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

// Development Supabase client (REST API) - Using new Secret Key
const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

// Tables to migrate (in dependency order)
const TABLES_TO_MIGRATE = [
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

const BATCH_SIZE = 500

async function migrate() {
  console.log('🚀 Starting Supabase Data Migration (Production → Development)...\n')

  let totalRowsMigrated = 0

  for (const tableName of TABLES_TO_MIGRATE) {
    console.log(`\n📦 Migrating ${tableName}...`)
    
    try {
      // Read all data from production
      const { data: prodData, error: readError } = await prodClient
        .from(tableName)
        .select('*')
      
      if (readError) {
        console.error(`   ❌ Failed to read from production ${tableName}:`, readError)
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
          break
        }
        
        insertedCount += batch.length
        
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
  
  console.log(`\n🎉 Migration Complete! Total rows migrated: ${totalRowsMigrated}`)
}

migrate().catch(console.error)
