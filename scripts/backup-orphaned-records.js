// scripts/backup-orphaned-records.js
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function backupOrphanedRecords() {
  console.log('💾 BACKING UP ORPHANED RECORDS FROM PRODUCTION\n')
  
  const backupDir = path.join(process.cwd(), 'production-backup')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir)
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = path.join(backupDir, `orphaned-backup-${timestamp}.json`)
  
  try {
    const orphanedRecords = {
      timestamp: timestamp,
      records: {
        user_spaces: [],
        recipes: [],
        ingredients: []
      }
    }

    // Get orphaned user_spaces
    console.log('📊 Finding orphaned user_spaces...')
    const { data: allUserSpaces } = await prodClient.from('user_spaces').select('*')
    const { data: allSpaces } = await prodClient.from('spaces').select('id')
    const spaceIds = new Set(allSpaces?.map(s => s.id) || [])
    
    for (const userSpace of allUserSpaces || []) {
      if (!spaceIds.has(userSpace.space_id)) {
        orphanedRecords.records.user_spaces.push(userSpace)
      }
    }
    
    // Get orphaned recipes
    console.log('📊 Finding orphaned recipes...')
    const { data: allRecipes } = await prodClient.from('recipes').select('*')
    
    for (const recipe of allRecipes || []) {
      if (!spaceIds.has(recipe.space_id)) {
        orphanedRecords.records.recipes.push(recipe)
      }
    }
    
    // Get orphaned ingredients
    console.log('📊 Finding orphaned ingredients...')
    const { data: allIngredients } = await prodClient.from('ingredients').select('*')
    const { data: existingRecipes } = await prodClient.from('recipes').select('id')
    const recipeIds = new Set(existingRecipes?.map(r => r.id) || [])
    
    for (const ingredient of allIngredients || []) {
      if (!recipeIds.has(ingredient.recipe_id)) {
        orphanedRecords.records.ingredients.push(ingredient)
      }
    }
    
    // Save backup
    fs.writeFileSync(backupFile, JSON.stringify(orphanedRecords, null, 2))
    
    const totalOrphaned = Object.values(orphanedRecords.records).reduce((sum, arr) => sum + arr.length, 0)
    
    console.log(`\n✅ Backup completed!`)
    console.log(`📁 Backup file: ${backupFile}`)
    console.log(`📊 Total orphaned records: ${totalOrphaned}`)
    console.log(`   - user_spaces: ${orphanedRecords.records.user_spaces.length}`)
    console.log(`   - recipes: ${orphanedRecords.records.recipes.length}`)
    console.log(`   - ingredients: ${orphanedRecords.records.ingredients.length}`)
    
    console.log(`\n🔍 Sample orphaned records:`)
    
    if (orphanedRecords.records.user_spaces.length > 0) {
      console.log(`\n👤 Orphaned user_spaces (first 2):`)
      orphanedRecords.records.user_spaces.slice(0, 2).forEach((record, i) => {
        console.log(`  ${i+1}. User: ${record.user_id}, Space: ${record.space_id} (MISSING)`)
      })
    }
    
    if (orphanedRecords.records.recipes.length > 0) {
      console.log(`\n🍳 Orphaned recipes (first 2):`)
      orphanedRecords.records.recipes.slice(0, 2).forEach((record, i) => {
        console.log(`  ${i+1}. Recipe: ${record.id}, Space: ${record.space_id} (MISSING)`)
      })
    }
    
    if (orphanedRecords.records.ingredients.length > 0) {
      console.log(`\n🥕 Orphaned ingredients (first 2):`)
      orphanedRecords.records.ingredients.slice(0, 2).forEach((record, i) => {
        console.log(`  ${i+1}. Ingredient: ${record.id}, Recipe: ${record.recipe_id} (MISSING)`)
      })
    }
    
    return backupFile
    
  } catch (err) {
    console.error('❌ Backup failed:', err.message)
    return null
  }
}

backupOrphanedRecords().catch(console.error)
