import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aajeyifqrupykjyapoft.supabase.co'
const supabaseKey = 'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'

const client = createClient(supabaseUrl, supabaseKey)

async function checkIngredients() {
  console.log('Checking ingredients in Kitchen Stage recipes...\n')
  
  // Get recipes in Kitchen Stage
  const { data: recipes, error: recipeError } = await client
    .from('recipes')
    .select('id, title')
    .eq('space_id', 'e5d604e7-36eb-4ce2-b40b-4ab491d80c27')
  
  if (recipeError) {
    console.error('Recipe error:', recipeError)
    return
  }
  
  // Check ingredients for each recipe
  for (const recipe of recipes) {
    console.log(`\n=== Recipe: ${recipe.title} ===`)
    
    const { data: ingredients, error: ingError } = await client
      .from('ingredients')
      .select('*')
      .eq('recipe_id', recipe.id)
    
    if (ingError) {
      console.error('Ingredient error:', ingError)
      continue
    }
    
    ingredients.forEach((ing, idx) => {
      console.log(`Ingredient ${idx + 1}:`)
      console.log(`  - food_id: ${ing.food_id || 'NULL'}`)
      console.log(`  - unit_id: ${ing.unit_id || 'NULL'}`)
      console.log(`  - food_name: ${ing.food_name || 'NULL'}`)
      console.log(`  - unit_name: ${ing.unit_name || 'NULL'}`)
      console.log(`  - amount: ${ing.amount}`)
    })
  }
}

checkIngredients()
