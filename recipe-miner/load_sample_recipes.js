import { createClient } from '@supabase/supabase-js'

// Production environment
const client = createClient(
  'https://zujlsbkxxsmiiwgyodph.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkyNTc5OCwiZXhwIjoyMDU3NTAxNzk4fQ.1cd4p7IFm2zc-OweVs-iUJPpa2w9_TuLuX56_WNERkw'
)

// Sample recipes for testing
const sampleRecipes = [
  {
    title: "Classic Margherita Pizza",
    description: "A traditional Italian pizza with fresh mozzarella, tomatoes, and basil",
    image_url: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800",
    prep_time_minutes: 20,
    cook_time_minutes: 15,
    servings: 4,
    difficulty: "medium",
    is_public: true,
    privacy_level: "public",
    qa_status: "pending",
    user_id: "fc51da5e-30dd-42d9-bf53-a5fa42ae0193", // Admin user
    space_id: null,
    calories_per_serving: 280
  },
  {
    title: "Spaghetti Carbonara",
    description: "Creamy pasta with eggs, cheese, and pancetta",
    image_url: "https://images.unsplash.com/photo-1612874742237-652622088e97?w=800",
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 4,
    difficulty: "medium",
    is_public: true,
    privacy_level: "public",
    qa_status: "pending",
    user_id: "fc51da5e-30dd-42d9-bf53-a5fa42ae0193",
    space_id: null,
    calories_per_serving: 420
  },
  {
    title: "Caesar Salad",
    description: "Crisp romaine lettuce with Caesar dressing, croutons, and parmesan",
    image_url: "https://images.unsplash.com/photo-1550304943-4f24f1dd73b4?w=800",
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    servings: 4,
    difficulty: "easy",
    is_public: true,
    privacy_level: "public",
    qa_status: "flag", // Flagged for review
    user_id: "1fb3599f-960e-4bdb-9a99-cc71159cd824",
    space_id: null,
    calories_per_serving: 180
  },
  {
    title: "Beef Tacos",
    description: "Seasoned ground beef tacos with fresh toppings",
    image_url: "https://images.unsplash.com/photo-1551501273-5654036225bc?w=800",
    prep_time_minutes: 25,
    cook_time_minutes: 15,
    servings: 6,
    difficulty: "easy",
    is_public: true,
    privacy_level: "public",
    qa_status: "pending",
    user_id: "1fb3599f-960e-4bdb-9a99-cc71159cd824",
    space_id: null,
    calories_per_serving: 320
  },
  {
    title: "Thai Green Curry",
    description: "Spicy and fragrant Thai curry with vegetables",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    prep_time_minutes: 30,
    cook_time_minutes: 25,
    servings: 4,
    difficulty: "hard",
    is_public: true,
    privacy_level: "public",
    qa_status: "pending",
    user_id: "f9e14c58-4259-4afc-8bc5-115eb32ec5e4",
    space_id: null,
    calories_per_serving: 380
  }
]

// Sample ingredients for each recipe
const sampleIngredients = [
  // Margherita Pizza
  [
    { name: "Pizza dough", amount: "500g", unit: "g" },
    { name: "Tomato sauce", amount: "200", unit: "ml" },
    { name: "Fresh mozzarella", amount: "250", unit: "g" },
    { name: "Fresh basil", amount: "10", unit: "leaves" },
    { name: "Olive oil", amount: "2", unit: "tbsp" }
  ],
  // Carbonara
  [
    { name: "Spaghetti", amount: "400", unit: "g" },
    { name: "Eggs", amount: "4", unit: "large" },
    { name: "Pecorino cheese", amount: "100", unit: "g" },
    { name: "Pancetta", amount: "150", unit: "g" },
    { name: "Black pepper", amount: "1", unit: "tsp" }
  ],
  // Caesar Salad
  [
    { name: "Romaine lettuce", amount: "2", unit: "heads" },
    { name: "Caesar dressing", amount: "100", unit: "ml" },
    { name: "Parmesan cheese", amount: "50", unit: "g" },
    { name: "Croutons", amount: "100", unit: "g" },
    { name: "Lemon", amount: "1", unit: "whole" }
  ],
  // Beef Tacos
  [
    { name: "Ground beef", amount: "500", unit: "g" },
    { name: "Taco shells", amount: "12", unit: "pieces" },
    { name: "Lettuce", amount: "1", unit: "head" },
    { name: "Tomatoes", amount: "2", unit: "medium" },
    { name: "Cheddar cheese", amount: "200", unit: "g" }
  ],
  // Thai Green Curry
  [
    { name: "Green curry paste", amount: "3", unit: "tbsp" },
    { name: "Coconut milk", amount: "400", unit: "ml" },
    { name: "Chicken breast", amount: "500", unit: "g" },
    { name: "Thai basil", amount: "1", unit: "cup" },
    { name: "Vegetables", amount: "300", unit: "g" }
  ]
]

// Sample steps for each recipe
const sampleSteps = [
  // Margherita Pizza
  [
    "Preheat oven to 475°F (245°C)",
    "Roll out pizza dough on a floured surface",
    "Spread tomato sauce evenly on dough",
    "Add torn mozzarella pieces",
    "Drizzle with olive oil",
    "Bake for 12-15 minutes until crust is golden",
    "Top with fresh basil before serving"
  ],
  // Carbonara
  [
    "Cook spaghetti according to package directions",
    "Meanwhile, cook pancetta until crispy",
    "Beat eggs with grated pecorino cheese",
    "Drain pasta, reserve 1 cup pasta water",
    "Mix hot pasta with pancetta",
    "Remove from heat, add egg mixture",
    "Toss quickly, adding pasta water as needed",
    "Season with black pepper"
  ],
  // Caesar Salad
  [
    "Wash and dry romaine lettuce",
    "Tear lettuce into bite-sized pieces",
    "Toss with Caesar dressing",
    "Add croutons and parmesan cheese",
    "Squeeze lemon juice over top",
    "Serve immediately"
  ],
  // Beef Tacos
  [
    "Brown ground beef in a skillet",
    "Add taco seasoning and water",
    "Simmer until thickened",
    "Warm taco shells in oven",
    "Fill shells with beef",
    "Top with lettuce, tomatoes, and cheese"
  ],
  // Thai Green Curry
  [
    "Heat oil in a wok or large pan",
    "Fry curry paste until fragrant",
    "Add chicken and cook until sealed",
    "Pour in coconut milk",
    "Add vegetables and simmer",
    "Season with fish sauce and sugar",
    "Garnish with Thai basil"
  ]
]

async function loadSampleRecipes() {
  console.log('Loading sample recipes for testing approval workflow...')
  
  for (let i = 0; i < sampleRecipes.length; i++) {
    console.log(`\nLoading recipe: ${sampleRecipes[i].title}`)
    
    try {
      // Insert recipe
      const { data: recipe, error: recipeError } = await client
        .from('recipes')
        .insert(sampleRecipes[i])
        .select()
        .single()
      
      if (recipeError) {
        console.error('Error inserting recipe:', recipeError)
        continue
      }
      
      console.log(`✅ Recipe created with ID: ${recipe.id}`)
      
      // Insert ingredients
      for (const ingredient of sampleIngredients[i]) {
        const { error: ingredientError } = await client
          .from('ingredients')
          .insert({
            recipe_id: recipe.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit
          })
        
        if (ingredientError) {
          console.error('Error inserting ingredient:', ingredientError)
        }
      }
      
      // Insert steps
      for (let j = 0; j < sampleSteps[i].length; j++) {
        const { error: stepError } = await client
          .from('recipe_steps')
          .insert({
            recipe_id: recipe.id,
            step_number: j + 1,
            instruction: sampleSteps[i][j]
          })
        
        if (stepError) {
          console.error('Error inserting step:', stepError)
        }
      }
      
      console.log(`✅ Added ${sampleIngredients[i].length} ingredients and ${sampleSteps[i].length} steps`)
      
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }
  
  console.log('\n=== Loading Complete ===')
  
  // Verify the data
  const { data: pendingRecipes } = await client
    .from('recipes')
    .select('title, qa_status, user_id')
    .in('qa_status', ['pending', 'flag'])
  
  console.log('\nPending recipes in production:')
  pendingRecipes?.forEach(r => {
    console.log(`- ${r.title} (${r.qa_status}) by user ${r.user_id}`)
  })
}

loadSampleRecipes()
