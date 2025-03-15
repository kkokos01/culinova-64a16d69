
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import TestStatus from "./test-utils/TestStatus";
import ErrorDisplay from "./test-utils/ErrorDisplay";
import ResultDisplay from "./test-utils/ResultDisplay";
import { supabase } from "@/integrations/supabase/client";
import { RPCGetFoodDescendants, RPCGetFoodAncestors, RPCSearchFoods } from "@/types/supabase-rpc";

type TestResult = {
  success: boolean;
  message?: string;
  data?: any;
};

const FoodCatalogTester = () => {
  const { user } = useAuth();
  const { currentSpace, spaces, createSpace } = useSpace();
  const [testResults, setTestResults] = useState<{[key: string]: TestResult}>({});
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<{[key: string]: string}>({});
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [testSequenceRunning, setTestSequenceRunning] = useState(false);
  
  useEffect(() => {
    if (currentSpace) {
      setSpaceId(currentSpace.id);
    } else if (spaces.length > 0) {
      setSpaceId(spaces[0].id);
    }
  }, [currentSpace, spaces]);
  
  const ensureTestSpace = async () => {
    // If we already have a space, use it
    if (spaceId) {
      return spaceId;
    }
    
    // Otherwise try to create one
    try {
      const newSpace = await createSpace("Test Food Catalog");
      if (newSpace) {
        setSpaceId(newSpace.id);
        return newSpace.id;
      }
    } catch (error: any) {
      console.error("Error creating test space:", error.message);
      setErrorMessages({
        ...errorMessages,
        ensureSpace: `Error creating test space: ${error.message}`
      });
    }
    
    return null;
  };
  
  const updateTestResult = (testKey: string, result: TestResult) => {
    console.log(`Test ${testKey} completed:`, result);
    setTestResults(prev => ({
      ...prev,
      [testKey]: result
    }));
  };
  
  const testFetchCategories = async () => {
    try {
      // Add delay to ensure DB is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from("food_categories")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      
      const result: TestResult = {
        success: data && data.length > 0,
        message: data && data.length > 0 
          ? `Successfully fetched ${data.length} food categories` 
          : "No food categories found - the table may be empty",
        data: data && data.length > 0 ? data.slice(0, 5) : null
      };
      
      updateTestResult("fetchCategories", result);
      return result;
    } catch (error: any) {
      console.error("Error fetching food categories:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error fetching food categories: ${error.message}`
      };
      
      updateTestResult("fetchCategories", result);
      return result;
    }
  };
  
  const testCreateFood = async () => {
    const activeSpaceId = await ensureTestSpace();
    
    if (!activeSpaceId) {
      const result: TestResult = {
        success: false,
        message: "No active space available for testing"
      };
      
      updateTestResult("createFood", result);
      return result;
    }
    
    // Get a category for the test
    let categoryId = null;
    try {
      const { data: categories } = await supabase
        .from("food_categories")
        .select("id")
        .limit(1);
      
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      }
    } catch (error) {
      console.error("Error fetching category for food test:", error);
    }
    
    try {
      // Create a test food with timestamp to ensure uniqueness
      const timestamp = new Date().getTime();
      const testFood = {
        name: `Test Food ${timestamp}`,
        description: "A food created for testing purposes",
        category_id: categoryId,
        space_id: activeSpaceId,
        created_by: user?.id,
        tags: ["test", "catalog", "validation"]
      };
      
      const { data, error } = await supabase
        .from("foods")
        .insert(testFood)
        .select();
      
      if (error) throw error;
      
      // Add a delay to ensure trigger functions complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result: TestResult = {
        success: data && data.length > 0,
        message: data && data.length > 0 
          ? `Successfully created food: ${data[0].name}` 
          : "Food creation returned no data",
        data: data && data.length > 0 ? data[0] : null
      };
      
      updateTestResult("createFood", result);
      return result;
    } catch (error: any) {
      console.error("Error creating test food:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error creating test food: ${error.message}`
      };
      
      updateTestResult("createFood", result);
      return result;
    }
  };
  
  const testLtreeHierarchy = async () => {
    const activeSpaceId = await ensureTestSpace();
    
    if (!activeSpaceId) {
      const result: TestResult = {
        success: false,
        message: "No active space available for testing"
      };
      
      updateTestResult("ltreeHierarchy", result);
      return result;
    }
    
    try {
      // First create a parent food
      const timestamp = new Date().getTime();
      const parentFood = {
        name: `Parent Food ${timestamp}`,
        description: "A parent food for testing hierarchy",
        space_id: activeSpaceId,
        created_by: user?.id
      };
      
      const { data: parentData, error: parentError } = await supabase
        .from("foods")
        .insert(parentFood)
        .select();
      
      if (parentError) throw parentError;
      
      if (!parentData || parentData.length === 0) {
        throw new Error("Failed to create parent food");
      }
      
      // Wait for triggers to run
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now create a child food linking to the parent
      const childFood = {
        name: `Child of ${parentData[0].name}`,
        description: "A child food for testing hierarchy",
        parent_id: parentData[0].id,
        space_id: activeSpaceId,
        created_by: user?.id
      };
      
      const { data: childData, error: childError } = await supabase
        .from("foods")
        .insert(childFood)
        .select();
      
      if (childError) throw childError;
      
      if (!childData || childData.length === 0) {
        throw new Error("Failed to create child food");
      }
      
      // Wait for triggers to run
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Now fetch both to verify the path structure
      const { data: parentWithPath, error: pathError } = await supabase
        .from("foods")
        .select("*")
        .eq("id", parentData[0].id)
        .single();
      
      if (pathError) throw pathError;
      
      const { data: childWithPath, error: childPathError } = await supabase
        .from("foods")
        .select("*")
        .eq("id", childData[0].id)
        .single();
      
      if (childPathError) throw childPathError;
      
      console.log("Parent path:", parentWithPath.path);
      console.log("Child path:", childWithPath.path);
      
      // Now test the get_food_descendants RPC with proper string conversion
      // First ensure parentWithPath.path is a string
      const parentPathStr = String(parentWithPath.path);
      
      const params: RPCGetFoodDescendants = {
        food_path: parentPathStr
      };
      
      console.log("Calling get_food_descendants with params:", params);
      
      const { data: descendants, error: descendantsError } = await supabase
        .rpc('get_food_descendants', params);
      
      if (descendantsError) {
        console.error("Error fetching descendants:", descendantsError);
        throw descendantsError;
      }
      
      console.log("Descendants:", descendants);
      
      // Also test get_food_ancestors
      const childPathStr = String(childWithPath.path);
      
      const ancestorParams: RPCGetFoodAncestors = {
        food_path: childPathStr
      };
      
      console.log("Calling get_food_ancestors with params:", ancestorParams);
      
      const { data: ancestors, error: ancestorsError } = await supabase
        .rpc('get_food_ancestors', ancestorParams);
      
      if (ancestorsError) {
        console.error("Error fetching ancestors:", ancestorsError);
        throw ancestorsError;
      }
      
      console.log("Ancestors:", ancestors);
      
      const result: TestResult = {
        success: true,
        message: "Successfully tested ltree hierarchy with parent-child relationship",
        data: {
          parent: parentWithPath,
          child: childWithPath,
          descendants: descendants,
          ancestors: ancestors
        }
      };
      
      updateTestResult("ltreeHierarchy", result);
      
      return result;
    } catch (error: any) {
      console.error("Error testing ltree hierarchy:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error testing ltree hierarchy: ${error.message}`
      };
      
      updateTestResult("ltreeHierarchy", result);
      
      return result;
    }
  };
  
  const testFoodProperties = async () => {
    const activeSpaceId = await ensureTestSpace();
    
    if (!activeSpaceId) {
      const result: TestResult = {
        success: false,
        message: "No active space available for testing"
      };
      
      updateTestResult("foodProperties", result);
      
      return result;
    }
    
    try {
      // First create a test food
      const timestamp = new Date().getTime();
      const testFood = {
        name: `Nutritional Food ${timestamp}`,
        description: "A food for testing properties",
        space_id: activeSpaceId,
        created_by: user?.id
      };
      
      const { data: foodData, error: foodError } = await supabase
        .from("foods")
        .insert(testFood)
        .select();
      
      if (foodError) throw foodError;
      
      if (!foodData || foodData.length === 0) {
        throw new Error("Failed to create test food for properties");
      }
      
      // Wait for food to be fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get some units for testing
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .limit(5);
      
      if (unitsError) throw unitsError;
      
      if (!units || units.length === 0) {
        throw new Error("Couldn't find units for property test");
      }
      
      console.log("Available units:", units.map(u => `${u.id}: ${u.name} (${u.unit_type})`));
      
      // Find appropriate units
      const massUnit = units.find(u => u.unit_type === 'mass');
      if (!massUnit) {
        throw new Error("No mass unit available for testing");
      }
      
      // Add some properties to the food
      const caloriesProperty = {
        food_id: foodData[0].id,
        property_type: "calories",
        value: 150,
        per_amount: 100,
        per_unit_id: massUnit.id  // Use massUnit
      };
      
      const proteinProperty = {
        food_id: foodData[0].id,
        property_type: "protein",
        value: 5.2,
        per_amount: 100,
        per_unit_id: massUnit.id  // Use massUnit
      };
      
      console.log("Adding properties:", [caloriesProperty, proteinProperty]);
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("food_properties")
        .insert([caloriesProperty, proteinProperty])
        .select();
      
      if (propertiesError) {
        console.error("Error adding properties:", propertiesError);
        throw propertiesError;
      }
      
      console.log("Properties added:", propertiesData);
      
      // Now fetch the food with its properties
      const { data: foodWithProperties, error: fetchError } = await supabase
        .from("foods")
        .select(`
          *,
          food_properties (*)
        `)
        .eq("id", foodData[0].id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const result: TestResult = {
        success: true,
        message: `Successfully added and fetched properties for ${foodData[0].name}`,
        data: foodWithProperties
      };
      
      updateTestResult("foodProperties", result);
      
      return result;
    } catch (error: any) {
      console.error("Error testing food properties:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error testing food properties: ${error.message}`
      };
      
      updateTestResult("foodProperties", result);
      
      return result;
    }
  };
  
  const testFoodSearch = async () => {
    const activeSpaceId = await ensureTestSpace();
    
    if (!activeSpaceId) {
      const result: TestResult = {
        success: false,
        message: "No active space available for testing"
      };
      
      updateTestResult("foodSearch", result);
      
      return result;
    }
    
    try {
      // First create a unique food with specific terms for testing search
      const timestamp = new Date().getTime();
      const searchTerms = ["avocado", "organic", "superfood"];
      const testFood = {
        name: `Organic ${searchTerms[0]} ${timestamp}`,
        description: `This ${searchTerms[0]} is a ${searchTerms[2]} with healthy fats.`,
        space_id: activeSpaceId,
        created_by: user?.id,
        tags: searchTerms
      };
      
      const { data: foodData, error: foodError } = await supabase
        .from("foods")
        .insert(testFood)
        .select();
      
      if (foodError) throw foodError;
      
      if (!foodData || foodData.length === 0) {
        throw new Error("Failed to create test food for search");
      }
      
      // Wait for text search vectors to update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Now test searching for this food using the RPC
      const searchParams: RPCSearchFoods = {
        search_query: searchTerms[0],
        space_id: activeSpaceId
      };
      
      console.log("Running search with params:", searchParams);
      
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_foods', searchParams);
      
      if (searchError) {
        console.error("Search error:", searchError);
        throw searchError;
      }
      
      console.log("Search results count:", searchResults?.length ?? 0);
      
      const hasNewFood = searchResults?.some(food => food.id === foodData[0].id);
      
      const result: TestResult = {
        success: hasNewFood,
        message: hasNewFood 
          ? `Successfully found the newly created ${searchTerms[0]} food using search` 
          : `Failed to find the newly created ${searchTerms[0]} food using search`,
        data: {
          searchTerm: searchTerms[0],
          createdFood: foodData[0],
          searchResults: searchResults?.slice(0, 5)
        }
      };
      
      updateTestResult("foodSearch", result);
      
      return result;
    } catch (error: any) {
      console.error("Error testing food search:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error testing food search: ${error.message}`
      };
      
      updateTestResult("foodSearch", result);
      
      return result;
    }
  };
  
  const testCreateFoodCatalogRpcs = async () => {
    try {
      console.log("Testing create_food_catalog_rpcs function");
      
      // Add delay to ensure DB is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .rpc('create_food_catalog_rpcs');
      
      if (error) {
        console.error("Error calling create_food_catalog_rpcs:", error);
        throw error;
      }
      
      console.log("RPC function result:", data);
      
      const result: TestResult = {
        success: true,
        message: `Successfully verified food catalog RPC functions`,
        data
      };
      
      updateTestResult("createRpcs", result);
      
      return result;
    } catch (error: any) {
      console.error("Error testing food catalog RPCs:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error testing food catalog RPCs: ${error.message}`
      };
      
      updateTestResult("createRpcs", result);
      
      return result;
    }
  };
  
  const runAllTests = async () => {
    if (testSequenceRunning) return;
    
    setLoading(true);
    setTestSequenceRunning(true);
    setErrorMessages({});
    
    try {
      // Run tests in sequence with delay between tests
      console.log("Starting test sequence");
      
      await testCreateFoodCatalogRpcs();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testFetchCategories();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testCreateFood();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testLtreeHierarchy();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testFoodProperties();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testFoodSearch();
      
      console.log("All tests completed");
    } catch (error) {
      console.error("Error in test sequence:", error);
    } finally {
      setLoading(false);
      setTestSequenceRunning(false);
    }
  };
  
  useEffect(() => {
    if (user && spaceId) {
      runAllTests();
    }
  }, [user, spaceId]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Food Catalog Tester</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center p-4">
            Please sign in to run food catalog tests
          </div>
        ) : (
          <>
            {!spaceId && (
              <Alert variant="warning" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need a space to run these tests. The tests will create one automatically if needed.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="mt-2 space-y-2">
                  <TestStatus name="Verify RPC Functions" status={testResults.createRpcs?.success} />
                  <TestStatus name="Fetch Food Categories" status={testResults.fetchCategories?.success} />
                  <TestStatus name="Create Food Item" status={testResults.createFood?.success} />
                  <TestStatus name="Test Ltree Hierarchy" status={testResults.ltreeHierarchy?.success} />
                  <TestStatus name="Test Food Properties" status={testResults.foodProperties?.success} />
                  <TestStatus name="Test Food Search" status={testResults.foodSearch?.success} />
                </div>
              </div>
              
              <Separator />
              
              {/* Display any error messages */}
              <ErrorDisplay errors={errorMessages} />
              
              {Object.entries(testResults).map(([key, result]) => (
                result.data && (
                  <div key={key}>
                    <ResultDisplay 
                      title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                      data={result.data} 
                      emptyMessage="No data available" 
                    />
                    <Separator className="my-4" />
                  </div>
                )
              ))}
              
              <Button 
                onClick={runAllTests} 
                disabled={loading || testSequenceRunning}
                className="w-full mt-4"
              >
                {loading ? "Running Tests..." : "Run All Tests"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodCatalogTester;
