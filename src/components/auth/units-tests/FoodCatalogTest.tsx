
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useFoodCatalogTest = (updateResult: (result: any) => void, index: number, ensureTestSpace: () => Promise<string | null>): TestHookResult => {
  
  const runTest = async () => {
    // First ensure we have a space
    const activeSpaceId = await ensureTestSpace();
    
    if (!activeSpaceId) {
      updateResult({
        status: "error",
        message: "No active space found. Please create a space first."
      });
      return false;
    }
    
    updateResult({ status: "running" });
    
    try {
      // Test creating a food item
      const testFood = {
        name: `Test Food ${Date.now()}`,
        description: "A test food item created for validation",
        space_id: activeSpaceId,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };
      
      const { data: foodData, error: foodError } = await supabase
        .from("foods")
        .insert(testFood)
        .select();
      
      if (foodError) throw foodError;
      
      if (!foodData || foodData.length === 0) {
        throw new Error("Failed to create test food item");
      }
      
      const createdFood = foodData[0];
      
      // Verify path generation
      if (!createdFood.path) {
        throw new Error("Food path was not generated by trigger");
      }
      
      // Test creating a property for the food
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select("id")
        .eq("name", "gram")
        .single();
      
      if (unitError) {
        throw new Error(`Could not find gram unit: ${unitError.message}`);
      }
      
      const testProperty = {
        food_id: createdFood.id,
        property_type: "calories",
        value: 100,
        per_amount: 100,
        per_unit_id: unitData.id,
        is_verified: true
      };
      
      const { data: propData, error: propError } = await supabase
        .from("food_properties")
        .insert(testProperty)
        .select();
      
      if (propError) throw propError;
      
      // Test search vectors
      const { data: searchData, error: searchError } = await supabase
        .from("foods")
        .select("*")
        .eq("id", createdFood.id)
        .single();
      
      if (searchError) throw searchError;
      
      if (!searchData.search_vector_en) {
        throw new Error("Search vector was not generated");
      }
      
      updateResult({
        status: "success",
        message: "Successfully validated food catalog system",
        data: {
          food: createdFood,
          property: propData?.[0],
          searchVector: "Generated"
        }
      });
      
      return true;
    } catch (error: any) {
      console.error("Food catalog test error:", error);
      updateResult({
        status: "error",
        message: error.message || "Failed to test food catalog"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
