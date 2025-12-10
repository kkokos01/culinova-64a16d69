// scripts/migrate-food-categories.js
import { createClient } from '@supabase/supabase-js'

const prodClient = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

const devClient = createClient(
  'https://aajeyifqrupykjyapoft.supabase.co',
  'sb_secret__cdpOoJN96JA0ihT4rQcDQ_CvNSjllG'
)

async function migrateFoodCategories() {
  console.log('🍎 Migrating Food Categories (Final Missing Piece)\n')

  try {
    // Check if food_categories exists in production
    console.log('📊 Checking production food_categories...')
    const { data: prodCategories, error: catError } = await prodClient
      .from('food_categories')
      .select('*')
    
    if (catError) {
      console.error('❌ Failed to read food_categories:', catError)
      console.log('ℹ️  Table might not exist or be accessible')
      return
    }
    
    if (!prodCategories || prodCategories.length === 0) {
      console.log('ℹ️  No food_categories data found')
      return
    }
    
    console.log(`✅ Found ${prodCategories.length} food categories in production`)
    
    // Clear dev food_categories
    await devClient.from('food_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('🧹 Cleared dev food_categories table')
    
    // Insert food categories
    const { error: insertError } = await devClient
      .from('food_categories')
      .insert(prodCategories)
    
    if (insertError) {
      console.error('❌ Failed to insert food_categories:', insertError)
      return
    }
    
    console.log(`✅ Migrated ${prodCategories.length} food categories to dev`)
    
    // Now migrate foods
    console.log('\n🍎 Migrating Foods...')
    const { data: prodFoods, error: foodsError } = await prodClient
      .from('foods')
      .select('*')
    
    if (foodsError) {
      console.error('❌ Failed to read foods:', foodsError)
      return
    }
    
    if (!prodFoods || prodFoods.length === 0) {
      console.log('ℹ️  No foods data found')
      return
    }
    
    console.log(`✅ Found ${prodFoods.length} foods in production`)
    
    // Clear dev foods
    await devClient.from('foods').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('🧹 Cleared dev foods table')
    
    // Insert foods
    const { error: foodsInsertError } = await devClient
      .from('foods')
      .insert(prodFoods)
    
    if (foodsInsertError) {
      console.error('❌ Failed to insert foods:', foodsInsertError)
      return
    }
    
    console.log(`✅ Migrated ${prodFoods.length} foods to dev`)
    
    console.log('\n🎉 Food migration complete!')
    console.log('🍎 Food Categories: ✅')
    console.log('🍎 Foods: ✅')
    
  } catch (err) {
    console.error('❌ Migration error:', err.message)
  }
}

migrateFoodCategories().catch(console.error)
