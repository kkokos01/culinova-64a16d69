/**
 * Test harness for recipe generation prompts
 * Validates that the new enhanced prompts work correctly with Gemini
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - use production environment for testing
const SUPABASE_URL = 'https://zujlsbkxxsmiiwgyodph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1amxzYmt4eHNtaWl3Z3lvZHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MjU3OTgsImV4cCI6MjA1NzUwMTc5OH0.sUuM7V1rESlwZPAr_4rzQMVlPh54GDSTolPGtrZA3kY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test cases covering different combinations
const testCases = [
  {
    name: 'Simple Tried & True',
    request: {
      concept: 'spaghetti aglio e olio',
      userStyle: { complexity: 'simple', novelty: 'tried_true' },
      servings: 4,
      skill: 'beginner',
      timeConstraint: 'under-30'
    }
  },
  {
    name: 'Balanced Fresh Twist',
    request: {
      concept: 'chicken stir fry',
      userStyle: { complexity: 'balanced', novelty: 'fresh_twist' },
      servings: 4,
      skill: 'intermediate',
      dietary: ['gluten-free'],
      allowedEquipment: ['stovetop', 'wok']
    }
  },
  {
    name: 'Project Adventurous',
    request: {
      concept: 'beef wellington',
      userStyle: { complexity: 'project', novelty: 'adventurous' },
      servings: 6,
      skill: 'advanced',
      timeConstraint: 'none',
      cost: 'premium-ingredients',
      allowedEquipment: ['oven', 'stovetop', 'food_processor']
    }
  },
  {
    name: 'Custom Pantry Selection',
    request: {
      concept: 'vegetable curry',
      userStyle: { complexity: 'balanced', novelty: 'fresh_twist' },
      pantryMode: 'custom_selection',
      pantryItems: [
        { id: '1', name: 'coconut milk', quantity: '1 can' },
        { id: '2', name: 'curry powder', quantity: '2 tbsp' },
        { id: '3', name: 'rice', quantity: '2 cups' }
      ],
      selectedPantryItemIds: {
        '1': 'required',
        '2': 'required',
        '3': 'optional'
      }
    }
  },
  {
    name: 'Multiple Dietary Constraints',
    request: {
      concept: 'chocolate dessert',
      userStyle: { complexity: 'simple', novelty: 'tried_true' },
      dietary: ['vegan', 'gluten-free', 'nut-free'],
      timeConstraint: 'under-15'
    }
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`Request:`, JSON.stringify(testCase.request, null, 2));
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-recipe', {
      body: { recipeRequest: testCase.request }
    });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }

    // Parse the response
    let recipe;
    try {
      recipe = JSON.parse(data.response);
    } catch (parseError) {
      console.error(`❌ Failed to parse response JSON`);
      return { success: false, error: 'Invalid JSON response' };
    }

    // Validate required fields
    const requiredFields = [
      'title', 'description', 'prepTimeMinutes', 'cookTimeMinutes',
      'servings', 'difficulty', 'ingredients', 'steps', 'tags',
      'twists', 'userStyle', 'alignmentNotes', 'qualityChecks'
    ];

    const missingFields = requiredFields.filter(field => !(field in recipe));
    if (missingFields.length > 0) {
      console.error(`❌ Missing fields: ${missingFields.join(', ')}`);
      return { success: false, error: `Missing fields: ${missingFields.join(', ')}` };
    }

    // Validate userStyle matches request
    if (recipe.userStyle.complexity !== testCase.request.userStyle.complexity ||
        recipe.userStyle.novelty !== testCase.request.userStyle.novelty) {
      console.error(`❌ userStyle mismatch`);
      return { success: false, error: 'userStyle does not match request' };
    }

    // Validate twist rules
    const twistCount = recipe.twists.length;
    const novelty = testCase.request.userStyle.novelty;
    if (novelty === 'tried_true' && twistCount !== 0) {
      console.error(`❌ tried_true recipe should have 0 twists`);
      return { success: false, error: 'tried_true recipe should have 0 twists' };
    }
    if (novelty === 'fresh_twist' && twistCount !== 1) {
      console.error(`❌ fresh_twist recipe should have exactly 1 twist`);
      return { success: false, error: 'fresh_twist recipe should have exactly 1 twist' };
    }
    if (novelty === 'adventurous' && (twistCount < 1 || twistCount > 3)) {
      console.error(`❌ adventurous recipe should have 1-3 twists`);
      return { success: false, error: 'adventurous recipe should have 1-3 twists' };
    }

    // Check if fallback was used
    if (data.usedFallback) {
      console.log(`⚠️  JSON extraction fallback was used`);
    }

    // Display warnings if any
    if (data.warnings && data.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${data.warnings.join(', ')}`);
    }

    console.log(`✅ Success: Generated "${recipe.title}"`);
    console.log(`   - Ingredients: ${recipe.ingredients.length}`);
    console.log(`   - Steps: ${recipe.steps.length}`);
    console.log(`   - Twists: ${recipe.twists.length}`);
    console.log(`   - Used fallback: ${data.usedFallback || false}`);
    
    return { 
      success: true, 
      recipe: {
        title: recipe.title,
        ingredientCount: recipe.ingredients.length,
        stepCount: recipe.steps.length,
        twistCount: recipe.twists.length,
        usedFallback: data.usedFallback || false,
        warnings: data.warnings || []
      }
    };

  } catch (err) {
    console.error(`❌ Unexpected error:`, err);
    return { success: false, error: err.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting recipe prompt validation tests...\n');
  
  const results = [];
  let successCount = 0;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({ name: testCase.name, ...result });
    if (result.success) successCount++;
    
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${testCases.length - successCount}`);
  console.log(`Success rate: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  
  // Failed tests details
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  // Fallback usage statistics
  const fallbackUsed = results.filter(r => r.success && r.recipe.usedFallback).length;
  if (fallbackUsed > 0) {
    console.log(`\n⚠️  JSON fallback used in ${fallbackUsed}/${successCount} successful tests`);
  }
  
  // Overall assessment
  const successRate = successCount / testCases.length;
  if (successRate >= 0.95) {
    console.log('\n✅ Excellent! 95%+ success rate achieved.');
  } else if (successRate >= 0.80) {
    console.log('\n✅ Good! 80%+ success rate achieved.');
  } else {
    console.log('\n❌ Poor success rate. Need to investigate issues.');
  }
  
  return results;
}

// Run tests if called directly
if (import.meta.main) {
  runAllTests().catch(console.error);
}

export { runAllTests, runTest };
