
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FoodCategory {
  id: string;
  name: string;
  description: string;
}

export interface Food {
  id: string;
  name: string;
  description: string;
  path: string;
  parent_id: string | null;
  category_id: string | null;
  tags: string[];
  properties: Record<string, any>;
  inheritable_properties: Record<string, any>;
}

export function useFoodCatalogTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean | string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [createdFood, setCreatedFood] = useState<Food | null>(null);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [hierarchyResults, setHierarchyResults] = useState<{
    ancestors: Food[];
    descendants: Food[];
  }>({ ancestors: [], descendants: [] });
  const { toast } = useToast();
  const [isTestRunning, setIsTestRunning] = useState(false);
  
  // Reset all test states
  const resetTests = () => {
    setTestResults({});
    setErrorMessages({});
    setCreatedFood(null);
    setSearchResults([]);
    setHierarchyResults({ ancestors: [], descendants: [] });
  };

  // Test 1: Verify RPC Functions exist and are callable
  const verifyRpcFunctions = async (): Promise<boolean> => {
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
  const fetchFoodCategories = async (): Promise<boolean> => {
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
      setCategories(data);
      return true;
    } catch (error: any) {
      console.error("Error fetching food categories:", error);
      throw error;
    }
  };

  // Test 3: Create a test food item
  const createTestFood = async (): Promise<Food> => {
    console.log("Starting create food test");
    try {
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
        category_id: categoryId,
        tags: ['test', 'catalog', 'validation']
      };
      
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
      setCreatedFood(data);
      return data;
    } catch (error: any) {
      console.error("Error creating test food:", error);
      throw error;
    }
  };

  // Test 4: Test ltree hierarchy
  const testLtreeHierarchy = async (food: Food): Promise<boolean> => {
    console.log("Starting ltree hierarchy test with food:", food);
    try {
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
          food_path: food.path.toString() 
        });
        
      if (descendantsError) {
        console.error("Error getting descendants:", descendantsError);
        throw descendantsError;
      }
      
      console.log("Descendants test result:", descendants);
      
      // Test get_food_ancestors RPC
      const { data: ancestors, error: ancestorsError } = await supabase
        .rpc('get_food_ancestors', { 
          food_path: childFood.path.toString() 
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
      
      setHierarchyResults({
        descendants: descendants || [],
        ancestors: ancestors || []
      });
      
      return true;
    } catch (error: any) {
      console.error("Error testing ltree hierarchy:", error);
      throw error;
    }
  };

  // Test 5: Test food properties
  const testFoodProperties = async (food: Food): Promise<boolean> => {
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
      
      // Update created food with properties
      setCreatedFood(data);
      return true;
    } catch (error: any) {
      console.error("Error testing food properties:", error);
      throw error;
    }
  };

  // Test 6: Test food search
  const testFoodSearch = async (): Promise<boolean> => {
    console.log("Starting food search test");
    try {
      // Create a searchable food item
      const timestamp = Date.now().toString();
      const searchTerm = "avocado";
      const foodName = `Organic ${searchTerm} ${timestamp}`;
      
      const foodData = {
        name: foodName,
        description: `This ${searchTerm} is a superfood with healthy fats.`,
        path: foodName.toLowerCase().replace(/\s+/g, '_'),
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
      const spaceId = searchableFood.space_id;
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_foods', {
          search_query: searchTerm,
          space_id: spaceId
        });
        
      if (searchError) throw searchError;
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error(`No results found for search term "${searchTerm}"`);
      }
      
      console.log(`Found ${searchResults.length} results for "${searchTerm}"`, searchResults);
      
      // Check if our newly created item is in the results
      const foundNewItem = searchResults.some(item => item.id === searchableFood.id);
      
      setSearchResults(searchResults);
      
      return true;
    } catch (error: any) {
      console.error("Error testing food search:", error);
      throw error;
    }
  };

  // Run all tests in sequence
  const runAllTests = async () => {
    if (isTestRunning) {
      console.log("Test is already running, skipping");
      return;
    }
    
    setIsTestRunning(true);
    setIsLoading(true);
    resetTests();
    
    const newResults: Record<string, boolean | string> = {};
    const newErrors: Record<string, string> = {};
    
    try {
      // Test 1: Verify RPC Functions
      try {
        const rpcResult = await verifyRpcFunctions();
        newResults.rpcFunctions = rpcResult;
      } catch (error: any) {
        newResults.rpcFunctions = false;
        newErrors.rpcFunctions = error.message;
      }
      
      // Test 2: Fetch Food Categories
      try {
        const categoriesResult = await fetchFoodCategories();
        newResults.foodCategories = categoriesResult;
      } catch (error: any) {
        newResults.foodCategories = false;
        newErrors.foodCategories = error.message;
      }
      
      // Test 3: Create Food Item
      let testFood = null;
      try {
        testFood = await createTestFood();
        newResults.createFood = true;
      } catch (error: any) {
        newResults.createFood = false;
        newErrors.createFood = error.message;
      }
      
      // Only continue with hierarchy and properties tests if food was created
      if (testFood) {
        // Test 4: Test Ltree Hierarchy
        try {
          const hierarchyResult = await testLtreeHierarchy(testFood);
          newResults.ltreeHierarchy = hierarchyResult;
        } catch (error: any) {
          newResults.ltreeHierarchy = false;
          newErrors.ltreeHierarchy = error.message;
        }
        
        // Test 5: Test Food Properties
        try {
          const propertiesResult = await testFoodProperties(testFood);
          newResults.foodProperties = propertiesResult;
        } catch (error: any) {
          newResults.foodProperties = false;
          newErrors.foodProperties = error.message;
        }
      } else {
        newResults.ltreeHierarchy = false;
        newErrors.ltreeHierarchy = "Test skipped: No test food available";
        newResults.foodProperties = false;
        newErrors.foodProperties = "Test skipped: No test food available";
      }
      
      // Test 6: Test Food Search
      try {
        const searchResult = await testFoodSearch();
        newResults.foodSearch = searchResult;
      } catch (error: any) {
        newResults.foodSearch = false;
        newErrors.foodSearch = error.message;
      }
    } catch (error: any) {
      console.error("Unexpected error running tests:", error);
      toast({
        title: "Test Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTestResults(newResults);
      setErrorMessages(newErrors);
      setIsLoading(false);
      setIsTestRunning(false);
      
      // Log final results for debugging
      console.log("Final test results:", newResults);
      console.log("Error messages:", newErrors);
    }
  };

  return {
    isLoading,
    testResults,
    errorMessages,
    categories,
    createdFood,
    searchResults,
    hierarchyResults,
    runAllTests
  };
}
