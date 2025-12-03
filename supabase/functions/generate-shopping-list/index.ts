import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShoppingRequest {
  recipeIngredients: Array<{
    name: string;
    quantity?: string;
  }>;
  pantryItems: Array<{
    name: string;
    quantity?: string;
  }>;
  fromRecipeId?: string;
}

interface ShoppingResponse {
  items: Array<{
    name: string;
    quantity?: string;
    category: string;
  }>;
  message?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { recipeIngredients, pantryItems }: ShoppingRequest = await req.json()

    if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
      throw new Error('recipeIngredients is required and must be an array')
    }

    if (!pantryItems || !Array.isArray(pantryItems)) {
      throw new Error('pantryItems is required and must be an array')
    }

    // Initialize Gemini AI
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Configure Gemini 2.5 Flash for speed (same as recipe generation)
    console.log('⚡ Using gemini-2.5-flash model for shopping list generation');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    })

    // Create the prompt for AI analysis
    const systemPrompt = `You are a kitchen assistant performing "Gap Analysis" between recipe ingredients and pantry inventory.

TASK: Compare Recipe Ingredients vs Pantry Inventory and return ONLY items the user needs to buy.

RULES:
1. Return ONLY missing items that need to be purchased
2. Deduplicate items (if recipe needs onions twice, list once with combined quantity)
3. Ignore common staples and cooking basics: Water, Salt, Pepper, Cooking Oil, Vegetable Oil, Canola Oil, Olive Oil, Butter, Flour, Sugar
4. Be smart about ingredient matching - if pantry has "chicken thighs" and recipe needs "chicken breast", consider it available
5. Categorize items STRICTLY into one of these exact categories:
   - "Produce"
   - "Meat & Seafood" 
   - "Dairy & Eggs"
   - "Bakery"
   - "Pantry"
   - "Spices"
   - "Beverages"
   - "Frozen"
   - "Other"

INPUT FORMAT:
Recipe Ingredients: ${JSON.stringify(recipeIngredients, null, 2)}
Pantry Inventory: ${JSON.stringify(pantryItems, null, 2)}

OUTPUT FORMAT:
Return ONLY a JSON array with this exact structure:
[
  {
    "name": "item name",
    "quantity": "quantity text (optional)",
    "category": "Produce|Meat & Seafood|Dairy & Eggs|Bakery|Pantry|Spices|Beverages|Frozen|Other"
  }
]

If ALL ingredients are available in pantry, return an empty array: []

Do not include explanations, comments, or any text outside the JSON array.`

    // Generate AI response
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    // Parse and validate AI response
    let aiItems: any[]
    try {
      aiItems = JSON.parse(text)
      if (!Array.isArray(aiItems)) {
        throw new Error('AI response is not an array')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      throw new Error('Invalid AI response format')
    }

    // Validate and clean AI items
    const validCategories = [
      'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 
      'Pantry', 'Spices', 'Beverages', 'Frozen', 'Other'
    ]

    const cleanedItems = aiItems
      .filter((item: any) => {
        return item && 
               typeof item.name === 'string' && 
               item.name.trim().length > 0 &&
               (!item.category || validCategories.includes(item.category))
      })
      .map((item: any) => ({
        name: item.name.trim(),
        quantity: item.quantity?.trim() || undefined,
        category: item.category && validCategories.includes(item.category) 
          ? item.category 
          : 'Other'
      }))

    // Add message for empty array (all ingredients available)
    const message = cleanedItems.length === 0 
      ? 'Great! All ingredients for this recipe are already in your pantry.'
      : undefined

    const response_data: ShoppingResponse = {
      items: cleanedItems,
      message
    }

    return new Response(
      JSON.stringify(response_data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in generate-shopping-list:', error)
    
    const errorResponse = {
      error: true,
      message: error.message || 'Failed to generate shopping list'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
