// NOTE: This is a Deno edge function. IDE may show module resolution errors for Deno imports,
// but these work correctly at runtime. The function has been successfully deployed and tested.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipe, style = 'photorealistic', aspectRatio = '4:3' } = await req.json()

    if (!recipe || !recipe.title) {
      throw new Error('Recipe data is required')
    }

    // DEBUG: Log the received recipe data
    console.log('DEBUG: Received recipe data:', JSON.stringify({
      title: recipe.title,
      description: recipe.description,
      ingredientCount: recipe.ingredients?.length || 0,
      ingredients: recipe.ingredients?.slice(0, 3)
    }))

    // Create image prompt
    const keyIngredients = recipe.ingredients
      ?.slice(0, 5)
      ?.map((ing: any) => ing.food_name || ing.name || 'ingredient')
      ?.filter((name: string) => name && name !== 'unknown ingredient')
      ?.join(', ') || ''

    let prompt = `A professional food photography of ${recipe.title}`
    
    if (recipe.description) {
      prompt += `, ${recipe.description}`
    }
    
    // Add explicit ingredient instructions
    if (keyIngredients) {
      prompt += `. The dish must clearly show these ingredients: ${keyIngredients}`
      prompt += '. Do not include any vegetables or ingredients not listed above.'
    }

    // DEBUG: Log the generated prompt
    console.log('DEBUG: Generated prompt:', prompt)

    // Style-specific modifications
    switch (style) {
      case 'artistic':
        prompt += ', artistic food photography, creative composition, dramatic lighting, food as art, stylized presentation, artistic food styling'
        break
      case 'minimalist':
        prompt += ', minimalist food photography, clean composition, simple background, natural lighting, minimal props, focus on food'
        break
      default: // photorealistic
        prompt += ', photorealistic food photography, natural lighting, restaurant quality presentation, appetizing colors, sharp focus'
    }

    prompt += ', 4K resolution, professional photography, high detail, appetizing presentation'

    // Call Google Imagen API
    const imagenResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GOOGLE_AI_API_KEY')
      },
      body: JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult'
        }
      })
    })

    if (!imagenResponse.ok) {
      const errorData = await imagenResponse.text()
      console.error('Google Imagen API error:', errorData)
      console.error('Request body sent:', JSON.stringify({
        instances: [{
          prompt: prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: aspectRatio,
          safetyFilterLevel: 'block_some',
          personGeneration: 'allow_adult'
        }
      }))
      throw new Error(`Google Imagen API error: ${imagenResponse.status} - ${errorData}`)
    }

    const imagenData = await imagenResponse.json()
    
    if (!imagenData.predictions || imagenData.predictions.length === 0) {
      throw new Error('No images generated')
    }

    const imageUrl = imagenData.predictions[0]?.bytesBase64Encoded
    
    if (!imageUrl) {
      throw new Error('No image data in response')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: `data:image/png;base64,${imageUrl}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error generating image:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
