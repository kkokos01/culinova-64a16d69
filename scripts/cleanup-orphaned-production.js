// scripts/cleanup-orphaned-production.js
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function cleanupOrphanedProduction() {
  console.log('🧹 PRODUCTION CLEANUP - CONSERVATIVE APPROACH\n')
  
  // Load the most recent backup
  const backupDir = path.join(process.cwd(), 'production-backup')
  const backupFiles = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('orphaned-backup-'))
    .sort()
    .reverse()
  
  if (backupFiles.length === 0) {
    console.error('❌ No backup files found. Run backup script first.')
    return
  }
  
  const latestBackup = path.join(backupDir, backupFiles[0])
  const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'))
  
  console.log(`📁 Using backup: ${backupFiles[0]}`)
  console.log(`📊 Records to clean up:`)
  console.log(`   - user_spaces: ${backupData.records.user_spaces.length}`)
  console.log(`   - recipes: ${backupData.records.recipes.length}`)
  console.log(`   - ingredients: ${backupData.records.ingredients.length}`)
  
  // Show detailed breakdown
  console.log(`\n🔍 Detailed breakdown:`)
  
  if (backupData.records.user_spaces.length > 0) {
    console.log(`\n👤 User Spaces to delete (${backupData.records.user_spaces.length}):`)
    const userCounts = {}
    backupData.records.user_spaces.forEach(record => {
      userCounts[record.user_id] = (userCounts[record.user_id] || 0) + 1
    })
    Object.entries(userCounts).forEach(([userId, count]) => {
      console.log(`   User ${userId}: ${count} records`)
    })
  }
  
  if (backupData.records.recipes.length > 0) {
    console.log(`\n🍳 Recipes to delete (${backupData.records.recipes.length}):`)
    backupData.records.recipes.forEach((record, i) => {
      console.log(`   ${i+1}. Recipe: ${record.id}, Space: ${record.space_id || 'NULL'}`)
    })
  }
  
  // WARNING and confirmation
  console.log(`\n⚠️  WARNING: You are about to DELETE data from PRODUCTION!`)
  console.log(`📋 This action:`)
  console.log(`   ❌ Cannot be undone`)
  console.log(`   💾 Has been backed up to: ${latestBackup}`)
  console.log(`   🕐 Should be run during low-traffic hours`)
  console.log(`   👤 Affects ${Object.keys(backupData.records.user_spaces.reduce((acc, r) => ({...acc, [r.user_id]: true}), {})).length} active user(s)`)
  
  console.log(`\n🤔 Are you sure you want to proceed?`)
  console.log(`   - Type 'YES' to proceed with cleanup`)
  console.log(`   - Type 'NO' or anything else to cancel`)
  console.log(`   - Type 'DRY-RUN' to see what would be deleted without actually deleting`)
  
  // In a real scenario, you'd wait for user input here
  // For now, let's create a dry-run version
  console.log(`\n🧪 DRY RUN MODE - Showing what would be deleted:`)
  
  let totalToDelete = 0
  
  // Dry run user_spaces deletion
  if (backupData.records.user_spaces.length > 0) {
    const userIds = backupData.records.user_spaces.map(r => r.id)
    console.log(`   📋 Would delete ${userIds.length} user_spaces records`)
    totalToDelete += userIds.length
  }
  
  // Dry run recipes deletion
  if (backupData.records.recipes.length > 0) {
    const recipeIds = backupData.records.recipes.map(r => r.id)
    console.log(`   📋 Would delete ${recipeIds.length} recipes`)
    totalToDelete += recipeIds.length
  }
  
  // Dry run ingredients deletion
  if (backupData.records.ingredients.length > 0) {
    const ingredientIds = backupData.records.ingredients.map(r => r.id)
    console.log(`   📋 Would delete ${ingredientIds.length} ingredients`)
    totalToDelete += ingredientIds.length
  }
  
  console.log(`\n📊 Total records that would be deleted: ${totalToDelete}`)
  console.log(`\n💡 To actually delete the records, modify this script to remove DRY RUN mode`)
  console.log(`🔧 Or run the manual cleanup commands below:`)
  
  if (backupData.records.user_spaces.length > 0) {
    const userIds = backupData.records.user_spaces.map(r => `'${r.id}'`).join(',')
    console.log(`\n-- Delete orphaned user_spaces`)
    console.log(`DELETE FROM user_spaces WHERE id IN (${userIds});`)
  }
  
  if (backupData.records.recipes.length > 0) {
    const recipeIds = backupData.records.recipes.map(r => `'${r.id}'`).join(',')
    console.log(`\n-- Delete orphaned recipes`)
    console.log(`DELETE FROM recipes WHERE id IN (${recipeIds});`)
  }
  
  console.log(`\n✅ Dry run completed. No data was actually deleted.`)
}

cleanupOrphanedProduction().catch(console.error)
