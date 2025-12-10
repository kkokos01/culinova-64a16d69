// scripts/investigate-ingredients.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

async function investigateIngredients() {
  console.log('🔍 INVESTIGATING INGREDIENTS ORPHAN DISCREPANCY\n')

  try {
    // Step 1: Get current production data
    console.log('📊 Step 1: Getting current production data...')
    
    const { data: allIngredients, error: ingredientsError } = await prodClient
      .from('ingredients')
      .select('*')
    
    if (ingredientsError) {
      console.error('❌ Failed to get ingredients:', ingredientsError)
      return
    }
    
    const { data: allRecipes, error: recipesError } = await prodClient
      .from('recipes')
      .select('id, space_id')
    
    if (recipesError) {
      console.error('❌ Failed to get recipes:', recipesError)
      return
    }
    
    console.log(`✅ Found ${allIngredients?.length || 0} ingredients in production`)
    console.log(`✅ Found ${allRecipes?.length || 0} recipes in production`)

    // Step 2: Check for orphaned ingredients
    console.log('\n🔍 Step 2: Checking for orphaned ingredients...')
    
    const recipeIds = new Set(allRecipes?.map(r => r.id) || [])
    const orphanedIngredients = []
    const validIngredients = []
    
    for (const ingredient of allIngredients || []) {
      if (recipeIds.has(ingredient.recipe_id)) {
        validIngredients.push(ingredient)
      } else {
        orphanedIngredients.push(ingredient)
      }
    }
    
    console.log(`📈 Current Analysis Results:`)
    console.log(`   ✅ Valid ingredients: ${validIngredients.length}`)
    console.log(`   ❓ Orphaned ingredients: ${orphanedIngredients.length}`)

    // Step 3: Check the orphaned recipes from backup
    console.log('\n🔍 Step 3: Checking orphaned recipes from backup...')
    
    const orphanedRecipeIds = [
      '92721daf-67d7-456a-a844-63e068c9ee5f',
      'fbd71193-f157-4cd3-8fae-62c463368869'
    ]
    
    const ingredientsForOrphanedRecipes = allIngredients?.filter(
      ing => orphanedRecipeIds.includes(ing.recipe_id)
    ) || []
    
    console.log(`📊 Ingredients belonging to the 2 orphaned recipes: ${ingredientsForOrphanedRecipes.length}`)
    
    // Step 4: Check if there are any other orphaned recipes
    console.log('\n🔍 Step 4: Looking for additional orphaned recipes...')
    
    const ingredientRecipeIds = [...new Set(allIngredients?.map(i => i.recipe_id) || [])]
    const missingRecipeIds = ingredientRecipeIds.filter(recipeId => !recipeIds.has(recipeId))
    
    console.log(`📊 Recipe IDs referenced by ingredients but not in recipes table: ${missingRecipeIds.length}`)
    
    if (missingRecipeIds.length > 0) {
      console.log('Missing recipe IDs:')
      missingRecipeIds.forEach((recipeId, i) => {
        const count = allIngredients?.filter(ing => ing.recipe_id === recipeId).length || 0
        console.log(`  ${i+1}. ${recipeId} (${count} ingredients)`)
      })
    }

    // Step 5: Theory verification
    console.log('\n🧪 Step 5: Testing the theory...')
    
    if (orphanedIngredients.length === 0) {
      console.log('✅ THEORY CONFIRMED: Production currently has no orphaned ingredients')
      console.log('💡 The 81 skipped ingredients during migration were likely due to:')
      console.log('   - Timing: 3 recipes were orphaned during migration but later cleaned up')
      console.log('   - Or migration validation was too conservative')
      console.log('   - Or the data changed between migration and backup')
    } else {
      console.log('❓ THEORY INCORRECT: There are still orphaned ingredients in production')
      console.log(`   - Found ${orphanedIngredients.length} truly orphaned ingredients`)
    }

    // Step 6: Recommendation
    console.log('\n🎯 RECOMMENDATION:')
    
    if (orphanedIngredients.length === 0) {
      console.log('✅ No production cleanup needed for ingredients')
      console.log('✅ The migration was overly cautious but production is clean')
      console.log('💡 Focus on the 20 records (user_spaces + recipes) that actually need cleanup')
    } else {
      console.log('⚠️  Additional ingredient cleanup needed')
      console.log(`📊 Need to clean up ${orphanedIngredients.length} orphaned ingredients`)
    }
    
  } catch (err) {
    console.error('❌ Investigation error:', err.message)
  }
}

investigateIngredients().catch(console.error)
