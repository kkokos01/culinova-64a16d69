// scripts/migrate-final-clean.js
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

const BATCH_SIZE = 500

// Log file for orphaned records
const logFile = path.join(process.cwd(), 'orphaned-records.log')

function logOrphanedRecord(tableName, record, reason) {
  const logEntry = `${new Date().toISOString()} - ${tableName}: ${reason} - ${JSON.stringify(record)}\n`
  fs.appendFileSync(logFile, logEntry)
}

async function migrateFinalClean() {
  console.log('🚀 Starting Final Clean Migration (Production → Development)\n')
  
  // Clear log file
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile)
  }
  fs.writeFileSync(logFile, '# Orphaned Records Log\n')
  console.log('📝 Logging orphaned records to: orphaned-records.log')

  let totalRowsMigrated = 0
  let totalOrphanedSkipped = 0

  // Migration order with validation
  const migrationSteps = [
    { name: 'spaces', validate: false },
    { name: 'user_profiles', validate: false },
    { name: 'user_spaces', validate: true, dependencies: ['spaces', 'user_profiles'] },
    { name: 'space_invitations', validate: true, dependencies: ['spaces', 'user_profiles'] },
    { name: 'recipes', validate: true, dependencies: ['spaces'] },
    { name: 'recipe_versions', validate: true, dependencies: ['recipes'] },
    { name: 'foods', validate: false }, // Add missing foods table
    { name: 'ingredients', validate: true, dependencies: ['recipes', 'foods'] },
    { name: 'pantry_items', validate: true, dependencies: ['spaces'] },
    { name: 'shopping_list_items', validate: false }
  ]

  for (const step of migrationSteps) {
    const { name: tableName, validate, dependencies } = step
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
      await devClient.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      console.log(`   🧹 Cleared dev table.`)
      
      let validRecords = prodData
      let orphanedCount = 0
      
      // Validate foreign key dependencies if required
      if (validate && dependencies) {
        validRecords = []
        
        for (const record of prodData) {
          let isValid = true
          let failureReason = ''
          
          // Check each dependency
          for (const depTable of dependencies) {
            if (depTable === 'spaces' && record.space_id) {
              const { data: exists } = await devClient
                .from('spaces')
                .select('id')
                .eq('id', record.space_id)
                .single()
              
              if (!exists) {
                isValid = false
                failureReason = `space_id ${record.space_id} not found in spaces`
                break
              }
            }
            
            if (depTable === 'user_profiles' && record.user_id) {
              const { data: exists } = await devClient
                .from('user_profiles')
                .select('id')
                .eq('user_id', record.user_id)
                .single()
              
              if (!exists) {
                isValid = false
                failureReason = `user_id ${record.user_id} not found in user_profiles`
                break
              }
            }
            
            if (depTable === 'recipes' && record.recipe_id) {
              const { data: exists } = await devClient
                .from('recipes')
                .select('id')
                .eq('id', record.recipe_id)
                .single()
              
              if (!exists) {
                isValid = false
                failureReason = `recipe_id ${record.recipe_id} not found in recipes`
                break
              }
            }
            
            if (depTable === 'foods' && record.food_id) {
              const { data: exists } = await devClient
                .from('foods')
                .select('id')
                .eq('id', record.food_id)
                .single()
              
              if (!exists) {
                isValid = false
                failureReason = `food_id ${record.food_id} not found in foods`
                break
              }
            }
          }
          
          if (isValid) {
            validRecords.push(record)
          } else {
            orphanedCount++
            logOrphanedRecord(tableName, record, failureReason)
          }
        }
        
        console.log(`   🔍 Validated: ${validRecords.length} valid, ${orphanedCount} orphaned skipped`)
        totalOrphanedSkipped += orphanedCount
      }
      
      // Insert valid records in batches
      let insertedCount = 0
      for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
        const batch = validRecords.slice(i, i + BATCH_SIZE)
        
        const { error: insertError } = await devClient
          .from(tableName)
          .insert(batch)
        
        if (insertError) {
          console.error(`   ❌ Failed to insert batch into ${tableName}:`, insertError)
          break
        }
        
        insertedCount += batch.length
        
        if (insertedCount % 1000 === 0 || insertedCount === validRecords.length) {
          console.log(`   📈 Progress: ${insertedCount}/${validRecords.length} rows migrated`)
        }
      }
      
      console.log(`   ✅ Migrated ${insertedCount}/${validRecords.length} rows to dev.`)
      totalRowsMigrated += insertedCount
      
    } catch (err) {
      console.error(`   ❌ Failed to migrate ${tableName}:`, err.message)
    }
  }
  
  console.log(`\n🎉 Migration Complete!`)
  console.log(`📊 Total rows migrated: ${totalRowsMigrated}`)
  console.log(`📋 Total orphaned records skipped: ${totalOrphanedSkipped}`)
  console.log(`📝 Orphaned records logged to: orphaned-records.log`)
  console.log(`✅ Dev database now aligned with production (valid data only)!`)
}

migrateFinalClean().catch(console.error)
