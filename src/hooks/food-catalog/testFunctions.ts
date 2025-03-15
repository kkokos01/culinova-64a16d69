
import { supabase } from "@/integrations/supabase/client";
import { Food, FoodCategory, HierarchyResults } from "./types";

// Test 1: Verify RPC Functions exist and are callable
export const verifyRpcFunctions = async (): Promise<boolean> => {
  console.log("Starting RPC functions verification test");
  try {
    // Check if search_foods RPC function exists
    const { error: searchError } = await supabase.rpc('search_foods', {
      search_query: "",
      space_id: ""
    });
    
    // It's expected to fail with a validation error, not a function not found error
    const isSearchValid = !searchError || 
      (searchError && !searchError.message.includes("function does not exist"));
    
    // Check if get_food_descendants RPC function exists
    const { error: descendantsError } = await supabase.rpc('get_food_descendants', {
      food_path: "test"
    });
    
    const isDescendantsValid = !descendantsError || 
      (descendantsError && !descendantsError.message.includes("function does not exist"));
    
    // Check if get_food_ancestors RPC function exists
    const { error: ancestorsError } = await supabase.rpc('get_food_ancestors', {
      food_path: "test"
    });
    
    const isAncestorsValid = !ancestorsError || 
      (ancestorsError && !ancestorsError.message.includes("function does not exist"));
    
    const allFunctionsExist = isSearchValid && isDescendantsValid && isAncestorsValid;
    
    console.log("RPC function verification results:", {
      searchValid: isSearchValid,
      descendantsValid: isDescendantsValid,
      ancestorsValid: isAncestorsValid,
      allValid: allFunctionsExist
    });
    
    if (!allFunctionsExist) {
      let errorMsg = "Missing RPC functions: ";
      if (!isSearchValid) errorMsg += "search_foods ";
      if (!isDescendantsValid) errorMsg += "get_food_descendants ";
      if (!isAncestorsValid) errorMsg += "get_food_ancestors ";
      
      throw new Error(errorMsg);
    }
    
    return true;
  } catch (error: any) {
    console.error("Error verifying RPC functions:", error);
    throw error;
  }
};

// Test 2: Fetch food categories
export const fetchFoodCategories = async (): Promise<{ categories: FoodCategory[] }> => {
  console.log("Starting food categories fetch test");
  try {
    const { data, error } = await supabase
      .from('food_categories')
      .select('*')
      .limit(10);
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error("No food categories found");
    }
    
    console.log(`Found ${data.length} food categories`);
    return { categories: data };
  } catch (error: any) {
    console.error("Error fetching food categories:", error);
    throw error;
  }
};

// Test 3: Create a test food item
export const createTestFood = async (
  currentSpace: any, 
  user: any, 
  categories: FoodCategory[]
): Promise<Food> => {
  console.log("Starting create food test");
  try {
    // Ensure we have a space and user
    if (!currentSpace || !user) {
      throw new Error("No active space or user found");
    }
    
    // Generate unique name to avoid conflicts
    const timestamp = Date.now().toString();
    const foodName = `Test Food ${timestamp}`;
    const foodPath = `test_food_${timestamp}`;
    
    let categoryId = null;
    if (categories.length > 0) {
      categoryId = categories[0].id;
    }
    
    const foodData = {
      name: foodName,
      description: "A food created for testing purposes",
      path: foodPath,
      space_id: currentSpace.id,
      category_id: categoryId,
      created_by: user.id,
      tags: ['test', 'catalog', 'validation']
    };
    
    console.log("Creating food with data:", foodData);
    
    const { data, error } = await supabase
      .from('foods')
      .insert(foodData)
      .select()
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error("Failed to create test food item");
    }
    
    console.log("Created test food:", data);
    return data;
  } catch (error: any) {
    console.error("Error creating test food:", error);
    throw error;
  }
};

// Test 4: Test ltree hierarchy
export const testLtreeHierarchy = async (
  food: Food,
  currentSpace: any,
  user: any
): Promise<HierarchyResults> => {
  console.log("Starting ltree hierarchy test with food:", food);
  try {
    // Ensure we have a space and user
    if (!currentSpace || !user) {
      throw new Error("No active space or user found");
    }
    
    // Create a child food item
    const timestamp = Date.now().toString();
    const childName = `Child Food ${timestamp}`;
    // Important: Ensure path is explicitly converted to string for ltree
    const childPath = `${food.path}.child_${timestamp}`;
    
    console.log("Creating child food with path:", childPath);
    
    const childData = {
      name: childName,
      description: "A child food for testing hierarchy",
      path: childPath,
      parent_id: food.id,
      space_id: currentSpace.id,
      created_by: user.id,
      tags: ['child', 'test']
    };
    
    const { data: childFood, error: childError } = await supabase
      .from('foods')
      .insert(childData)
      .select()
      .single();
      
    if (childError) {
      console.error("Error creating child food:", childError);
      throw childError;
    }
    
    if (!childFood) {
      throw new Error("Failed to create child food item");
    }
    
    console.log("Created child food:", childFood);
    
    // Small delay to ensure database updates are complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test get_food_descendants RPC
    const { data: descendants, error: descendantsError } = await supabase
      .rpc('get_food_descendants', { 
        food_path: food.path
      });
      
    if (descendantsError) {
      console.error("Error getting descendants:", descendantsError);
      throw descendantsError;
    }
    
    console.log("Descendants test result:", descendants);
    
    // Test get_food_ancestors RPC
    const { data: ancestors, error: ancestorsError } = await supabase
      .rpc('get_food_ancestors', { 
        food_path: childFood.path
      });
      
    if (ancestorsError) {
      console.error("Error getting ancestors:", ancestorsError);
      throw ancestorsError;
    }
    
    console.log("Ancestors test result:", ancestors);
    
    // Validate results
    const hasDescendant = descendants && descendants.some((d: any) => d.id === childFood.id);
    const hasAncestor = ancestors && ancestors.some((a: any) => a.id === food.id);
    
    if (!hasDescendant || !hasAncestor) {
      let errorMsg = "";
      if (!hasDescendant) errorMsg += "Descendant relationship failed. ";
      if (!hasAncestor) errorMsg += "Ancestor relationship failed.";
      throw new Error(errorMsg);
    }
    
    return {
      descendants: descendants || [],
      ancestors: ancestors || []
    };
  } catch (error: any) {
    console.error("Error testing ltree hierarchy:", error);
    throw error;
  }
};

// Test 5: Test food properties
export const testFoodProperties = async (food: Food): Promise<Food> => {
  console.log("Starting food properties test");
  try {
    // Update food with properties
    const properties = {
      calories: 150,
      protein: "5g",
      carbs: "20g"
    };
    
    const inheritableProperties = {
      organic: true,
      allergens: ["nuts", "dairy"]
    };
    
    const { data, error } = await supabase
      .from('foods')
      .update({
        properties,
        inheritable_properties: inheritableProperties
      })
      .eq('id', food.id)
      .select()
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error("Failed to update food properties");
    }
    
    console.log("Updated food with properties:", data);
    
    // Validate properties
    const hasCorrectProperties = 
      data.properties && 
      data.properties.calories === 150 &&
      data.properties.protein === "5g";
      
    const hasCorrectInheritableProps = 
      data.inheritable_properties && 
      data.inheritable_properties.organic === true;
      
    if (!hasCorrectProperties || !hasCorrectInheritableProps) {
      throw new Error("Food properties validation failed");
    }
    
    return data;
  } catch (error: any) {
    console.error("Error testing food properties:", error);
    throw error;
  }
};

// Test 6: Test food search
export const testFoodSearch = async (currentSpace: any, user: any): Promise<Food[]> => {
  console.log("Starting food search test");
  try {
    // Ensure we have a space and user
    if (!currentSpace || !user) {
      throw new Error("No active space or user found");
    }
    
    // Create a searchable food item
    const timestamp = Date.now().toString();
    const searchTerm = "avocado";
    const foodName = `Organic ${searchTerm} ${timestamp}`;
    
    const foodData = {
      name: foodName,
      description: `This ${searchTerm} is a superfood with healthy fats.`,
      path: foodName.toLowerCase().replace(/\s+/g, '_'),
      space_id: currentSpace.id,
      created_by: user.id,
      tags: [searchTerm, 'organic', 'superfood']
    };
    
    const { data: searchableFood, error: createError } = await supabase
      .from('foods')
      .insert(foodData)
      .select()
      .single();
      
    if (createError) throw createError;
    
    if (!searchableFood) {
      throw new Error("Failed to create searchable food item");
    }
    
    console.log("Created searchable food:", searchableFood);
    
    // Small delay to ensure search vectors are updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test search_foods RPC
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_foods', {
        search_query: searchTerm,
        space_id: currentSpace.id
      });
      
    if (searchError) throw searchError;
    
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No results found for search term "${searchTerm}"`);
    }
    
    console.log(`Found ${searchResults.length} results for "${searchTerm}"`, searchResults);
    
    return searchResults;
  } catch (error: any) {
    console.error("Error testing food search:", error);
    throw error;
  }
};
