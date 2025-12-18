import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Set proper headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Validate input
    const { recipeId } = await req.json();
    if (!recipeId || typeof recipeId !== 'string') {
      throw new Error('Invalid recipeId');
    }
    
    // Robust auth header parsing
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid auth header');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) throw new Error('Invalid auth');
    
    // Get recipe and verify ownership
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();
    
    if (recipeError || !recipe) throw new Error('Recipe not found');
    if (recipe.user_id !== user.id) throw new Error('Not owner');
    
    // First, remove recipe from all of the owner's collections
    const { error: removeError } = await supabaseClient
      .from('space_recipes')
      .delete()
      .eq('recipe_id', recipeId)
      .eq('added_by', user.id);
    
    if (removeError) throw removeError;
    
    // Check if recipe still exists in other users' collections
    const { data: remainingReferences, error: checkError } = await supabaseClient
      .from('space_recipes')
      .select('id')
      .eq('recipe_id', recipeId);
    
    if (checkError) throw checkError;
    
    // Only delete globally if no other references exist
    if (!remainingReferences || remainingReferences.length === 0) {
      const { error: deleteError } = await supabaseClient
        .from('recipes')
        .delete()
        .eq('id', recipeId);
      
      if (deleteError) throw deleteError;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          deleted: true,
          message: 'Recipe deleted permanently' 
        }), 
        { headers }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: true, 
          deleted: false,
          message: 'Recipe removed from your collections' 
        }), 
        { headers }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 400, headers }
    );
  }
});
