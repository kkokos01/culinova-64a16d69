-- Fix the operator precedence in the create_recipe_with_ingredients function
-- The previous migration had incorrect casting without parentheses

CREATE OR REPLACE FUNCTION create_recipe_with_ingredients(
    recipe_data JSONB,
    ingredients_data JSONB,
    steps_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recipe_id UUID;
    ingredient JSONB;
    step JSONB;
BEGIN
    -- Insert the recipe
    INSERT INTO recipes (
        title,
        description,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        difficulty,
        user_id,
        space_id,
        is_public,
        privacy_level,
        tags,
        batch_id,
        qa_status,
        created_at,
        updated_at
    ) VALUES (
        recipe_data->>'title',
        recipe_data->>'description',
        (recipe_data->>'prep_time_minutes')::INTEGER,
        (recipe_data->>'cook_time_minutes')::INTEGER,
        (recipe_data->>'servings')::INTEGER,
        recipe_data->>'difficulty',
        (recipe_data->>'user_id')::UUID,
        (recipe_data->>'space_id')::UUID,
        (recipe_data->>'is_public')::BOOLEAN,
        recipe_data->>'privacy_level',
        (recipe_data->'tags')::TEXT[],
        recipe_data->>'batch_id',
        recipe_data->>'qa_status',
        NOW(),
        NOW()
    ) RETURNING id INTO recipe_id;
    
    -- Insert ingredients (using text fields, not IDs)
    IF ingredients_data IS NOT NULL THEN
        FOR ingredient IN SELECT * FROM jsonb_array_elements(ingredients_data)
        LOOP
            INSERT INTO ingredients (
                recipe_id,
                food_name,
                unit_name,
                amount,
                order_index,
                created_at
            ) VALUES (
                recipe_id,
                ingredient->>'food_name',
                ingredient->>'unit_name',
                (ingredient->>'amount')::NUMERIC,
                (ingredient->>'order_index')::INTEGER,
                NOW()
            );
        END LOOP;
    END IF;
    
    -- Insert steps
    IF steps_data IS NOT NULL THEN
        FOR step IN SELECT * FROM jsonb_array_elements(steps_data)
        LOOP
            INSERT INTO recipe_steps (
                recipe_id,
                instruction,
                order_index,
                created_at
            ) VALUES (
                recipe_id,
                step->>'instruction',
                (step->>'order_index')::INTEGER,
                NOW()
            );
        END LOOP;
    END IF;
    
    -- Return the recipe ID
    RETURN recipe_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_recipe_with_ingredients TO authenticated;
