
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSpace } from "@/context/SpaceContext";
import { Food, FoodCategory, FoodProperty, PropertyType } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, X } from "lucide-react";
import { TestStatus } from "./test-utils/TestStatus";

interface TestResult {
  status: "idle" | "running" | "success" | "error";
  message?: string;
  data?: any;
}

const FoodCatalogTester = () => {
  const { currentSpace } = useSpace();
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedFood, setSelectedFood] = useState<string>("");
  const [newFoodName, setNewFoodName] = useState<string>("");
  const [newFoodDescription, setNewFoodDescription] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  
  const [testResults, setTestResults] = useState<{
    categories: TestResult;
    createFood: TestResult;
    fetchHierarchy: TestResult;
    properties: TestResult;
    search: TestResult;
  }>({
    categories: { status: "idle" },
    createFood: { status: "idle" },
    fetchHierarchy: { status: "idle" },
    properties: { status: "idle" },
    search: { status: "idle" },
  });
  
  // Test 1: Fetch Categories
  const testFetchCategories = async () => {
    if (!currentSpace) {
      setTestResults(prev => ({
        ...prev,
        categories: { 
          status: "error", 
          message: "No active space. Please select a space first." 
        }
      }));
      return;
    }
    
    setTestResults(prev => ({
      ...prev,
      categories: { status: "running" }
    }));
    
    try {
      // First, fetch global categories
      const { data: globalCategories, error: categoriesError } = await supabase
        .from("food_categories")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (categoriesError) throw categoriesError;
      
      // Then fetch space-specific settings
      const { data: settings, error: settingsError } = await supabase
        .from("space_category_settings")
        .select("*")
        .eq("space_id", currentSpace.id);
      
      if (settingsError) throw settingsError;
      
      // Combine the data
      const enhancedCategories = globalCategories.map(category => {
        const customSettings = settings?.find(s => s.category_id === category.id);
        return {
          ...category,
          custom_name: customSettings?.custom_name,
          custom_icon_url: customSettings?.custom_icon_url,
          custom_order: customSettings?.custom_order,
          is_enabled: customSettings?.is_enabled ?? true
        };
      });
      
      setCategories(enhancedCategories);
      
      setTestResults(prev => ({
        ...prev,
        categories: { 
          status: "success", 
          message: `Successfully fetched ${enhancedCategories.length} categories`,
          data: enhancedCategories
        }
      }));
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      setTestResults(prev => ({
        ...prev,
        categories: { 
          status: "error", 
          message: error.message || "Failed to fetch categories" 
        }
      }));
    }
  };
  
  // Test 2: Create a Food
  const testCreateFood = async () => {
    if (!currentSpace) {
      setTestResults(prev => ({
        ...prev,
        createFood: { 
          status: "error", 
          message: "No active space. Please select a space first." 
        }
      }));
      return;
    }
    
    if (!newFoodName) {
      setTestResults(prev => ({
        ...prev,
        createFood: { 
          status: "error", 
          message: "Food name is required" 
        }
      }));
      return;
    }
    
    setTestResults(prev => ({
      ...prev,
      createFood: { status: "running" }
    }));
    
    try {
      const newFood = {
        name: newFoodName,
        description: newFoodDescription,
        space_id: currentSpace.id,
        category_id: selectedCategory || null,
        parent_id: selectedParent || null,
        created_by: currentSpace.created_by // using space creator as a fallback
      };
      
      const { data, error } = await supabase
        .from("foods")
        .insert(newFood)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Refresh the foods list
        fetchRootFoods();
        
        setTestResults(prev => ({
          ...prev,
          createFood: { 
            status: "success", 
            message: `Successfully created food "${data[0].name}"`,
            data: data[0]
          }
        }));
        
        // Clear form
        setNewFoodName("");
        setNewFoodDescription("");
      } else {
        throw new Error("No data returned after insert");
      }
    } catch (error: any) {
      console.error("Error creating food:", error);
      setTestResults(prev => ({
        ...prev,
        createFood: { 
          status: "error", 
          message: error.message || "Failed to create food" 
        }
      }));
    }
  };
  
  // Test 3: Fetch Food Hierarchy
  const fetchRootFoods = async () => {
    if (!currentSpace) return;
    
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("space_id", currentSpace.id)
        .is("parent_id", null);
      
      if (error) throw error;
      
      setFoods(data || []);
    } catch (error) {
      console.error("Error fetching root foods:", error);
    }
  };
  
  const testFetchHierarchy = async () => {
    if (!currentSpace) {
      setTestResults(prev => ({
        ...prev,
        fetchHierarchy: { 
          status: "error", 
          message: "No active space. Please select a space first." 
        }
      }));
      return;
    }
    
    setTestResults(prev => ({
      ...prev,
      fetchHierarchy: { status: "running" }
    }));
    
    try {
      // First, fetch root foods (parent_id is null)
      const { data: rootFoods, error: rootError } = await supabase
        .from("foods")
        .select("*")
        .eq("space_id", currentSpace.id)
        .is("parent_id", null);
      
      if (rootError) throw rootError;
      
      // For the selected food (if any), fetch its children
      let children: Food[] = [];
      if (selectedFood) {
        const { data: foodChildren, error: childrenError } = await supabase
          .from("foods")
          .select("*")
          .eq("parent_id", selectedFood);
        
        if (childrenError) throw childrenError;
        children = foodChildren || [];
      }
      
      // For testing the ltree functionality, fetch foods by path
      // This is important to verify the hierarchical functionality
      let pathResults: any[] = [];
      if (selectedFood) {
        const { data: selectedFoodData, error: foodError } = await supabase
          .from("foods")
          .select("*")
          .eq("id", selectedFood)
          .single();
        
        if (foodError) throw foodError;
        
        if (selectedFoodData?.path) {
          // Find all descendants of the selected food
          const { data: descendants, error: descendantsError } = await supabase
            .rpc('get_food_descendants', { 
              food_path: selectedFoodData.path 
            });
          
          // If RPC fails, we'll use a regular query as fallback
          if (descendantsError) {
            console.warn("RPC not available, using fallback query:", descendantsError);
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("foods")
              .select("*")
              .filter('path', 'like', `${selectedFoodData.path}.%`);
            
            if (fallbackError) throw fallbackError;
            pathResults = fallbackData || [];
          } else {
            pathResults = descendants || [];
          }
        }
      }
      
      setFoods(rootFoods || []);
      
      setTestResults(prev => ({
        ...prev,
        fetchHierarchy: { 
          status: "success", 
          message: `Found ${rootFoods?.length || 0} root foods and ${children.length} children of selected food`,
          data: {
            rootFoods,
            children,
            pathResults
          }
        }
      }));
    } catch (error: any) {
      console.error("Error testing hierarchy:", error);
      setTestResults(prev => ({
        ...prev,
        fetchHierarchy: { 
          status: "error", 
          message: error.message || "Failed to test food hierarchy" 
        }
      }));
    }
  };
  
  // Test 4: Food Properties
  const testFoodProperties = async () => {
    if (!currentSpace) {
      setTestResults(prev => ({
        ...prev,
        properties: { 
          status: "error", 
          message: "No active space. Please select a space first." 
        }
      }));
      return;
    }
    
    if (!selectedFood) {
      setTestResults(prev => ({
        ...prev,
        properties: { 
          status: "error", 
          message: "Please select a food first" 
        }
      }));
      return;
    }
    
    setTestResults(prev => ({
      ...prev,
      properties: { status: "running" }
    }));
    
    try {
      // First fetch any existing properties
      const { data: existingProps, error: propsError } = await supabase
        .from("food_properties")
        .select("*")
        .eq("food_id", selectedFood);
      
      if (propsError) throw propsError;
      
      // Create a test property if none exists
      if (!existingProps || existingProps.length === 0) {
        // Get a weight unit (g)
        const { data: unitData, error: unitError } = await supabase
          .from("units")
          .select("*")
          .eq("name", "gram")
          .single();
        
        if (unitError) throw unitError;
        
        const testProperty: Partial<FoodProperty> = {
          food_id: selectedFood,
          property_type: "calories",
          value: 100,
          per_amount: 100,
          per_unit_id: unitData?.id,
          is_verified: true
        };
        
        const { data: newProp, error: newPropError } = await supabase
          .from("food_properties")
          .insert(testProperty)
          .select();
        
        if (newPropError) throw newPropError;
        
        setTestResults(prev => ({
          ...prev,
          properties: { 
            status: "success", 
            message: "Successfully created test food property",
            data: newProp
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          properties: { 
            status: "success", 
            message: `Food has ${existingProps.length} properties`,
            data: existingProps
          }
        }));
      }
    } catch (error: any) {
      console.error("Error testing food properties:", error);
      setTestResults(prev => ({
        ...prev,
        properties: { 
          status: "error", 
          message: error.message || "Failed to test food properties" 
        }
      }));
    }
  };
  
  // Test 5: Search
  const testSearch = async () => {
    if (!currentSpace) {
      setTestResults(prev => ({
        ...prev,
        search: { 
          status: "error", 
          message: "No active space. Please select a space first." 
        }
      }));
      return;
    }
    
    if (!searchTerm) {
      setTestResults(prev => ({
        ...prev,
        search: { 
          status: "error", 
          message: "Please enter a search term" 
        }
      }));
      return;
    }
    
    setTestResults(prev => ({
      ...prev,
      search: { status: "running" }
    }));
    
    try {
      // First try the RPC method (if it exists)
      let results: Food[] = [];
      
      try {
        const { data: rpcResults, error: rpcError } = await supabase
          .rpc('search_foods', { 
            search_query: searchTerm,
            space_id: currentSpace.id 
          });
        
        if (rpcError) throw rpcError;
        results = rpcResults || [];
      } catch (rpcFallbackError) {
        console.warn("RPC search not available, using fallback:", rpcFallbackError);
        
        // Fallback: direct query using websearch_to_tsquery
        const { data: fallbackResults, error: fallbackError } = await supabase
          .from("foods")
          .select("*")
          .eq("space_id", currentSpace.id)
          .textSearch('search_vector_en', searchTerm, {
            type: 'websearch',
            config: 'english'
          });
        
        if (fallbackError) throw fallbackError;
        results = fallbackResults || [];
      }
      
      setSearchResults(results);
      
      setTestResults(prev => ({
        ...prev,
        search: { 
          status: "success", 
          message: `Found ${results.length} results for "${searchTerm}"`,
          data: results
        }
      }));
    } catch (error: any) {
      console.error("Error searching foods:", error);
      setTestResults(prev => ({
        ...prev,
        search: { 
          status: "error", 
          message: error.message || "Failed to search foods" 
        }
      }));
    }
  };
  
  // Create RPC functions
  const createRpcFunctions = async () => {
    try {
      const { data, error } = await supabase.rpc('create_food_catalog_rpcs');
      if (error) throw error;
      alert(`Successfully created RPC functions: ${data}`);
    } catch (error: any) {
      console.error("Error creating RPC functions:", error);
      alert(`Error creating RPC functions: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Food Categories Test</h2>
        <Button 
          onClick={testFetchCategories} 
          disabled={!currentSpace || testResults.categories.status === "running"}
        >
          Fetch Categories
        </Button>
        
        <div className="mt-4">
          <TestStatus result={testResults.categories} />
          
          {testResults.categories.status === "success" && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Categories ({categories.length})</h3>
              <ul className="space-y-1">
                {categories.map(category => (
                  <li key={category.id} className="text-sm">
                    <strong>{category.custom_name || category.name}</strong>
                    {category.group_name && <span className="text-gray-500"> ({category.group_name})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create Food Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Food Name</label>
            <Input 
              value={newFoodName}
              onChange={e => setNewFoodName(e.target.value)}
              placeholder="Enter food name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea 
              value={newFoodDescription}
              onChange={e => setNewFoodDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.custom_name || category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Parent Food (Optional)</label>
            <Select value={selectedParent} onValueChange={setSelectedParent}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent food" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {foods.map(food => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={testCreateFood} 
            disabled={!currentSpace || !newFoodName || testResults.createFood.status === "running"}
          >
            Create Food
          </Button>
          
          <TestStatus result={testResults.createFood} />
        </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Food Hierarchy Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Food</label>
            <Select value={selectedFood} onValueChange={setSelectedFood}>
              <SelectTrigger>
                <SelectValue placeholder="Select food" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {foods.map(food => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={testFetchHierarchy} 
            disabled={!currentSpace || testResults.fetchHierarchy.status === "running"}
          >
            Test Hierarchy
          </Button>
          
          <TestStatus result={testResults.fetchHierarchy} />
          
          {testResults.fetchHierarchy.status === "success" && testResults.fetchHierarchy.data && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Root Foods ({testResults.fetchHierarchy.data.rootFoods.length})</h3>
                <ul className="max-h-40 overflow-y-auto space-y-1">
                  {testResults.fetchHierarchy.data.rootFoods.map((food: Food) => (
                    <li key={food.id} className="text-sm">{food.name}</li>
                  ))}
                </ul>
              </div>
              
              {selectedFood && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Children ({testResults.fetchHierarchy.data.children.length})</h3>
                  <ul className="max-h-40 overflow-y-auto space-y-1">
                    {testResults.fetchHierarchy.data.children.map((food: Food) => (
                      <li key={food.id} className="text-sm">{food.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedFood && testResults.fetchHierarchy.data.pathResults.length > 0 && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium mb-2">Path-based Results ({testResults.fetchHierarchy.data.pathResults.length})</h3>
                  <ul className="max-h-40 overflow-y-auto space-y-1">
                    {testResults.fetchHierarchy.data.pathResults.map((food: Food) => (
                      <li key={food.id} className="text-sm">{food.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Food Properties Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Food</label>
            <Select value={selectedFood} onValueChange={setSelectedFood}>
              <SelectTrigger>
                <SelectValue placeholder="Select food" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {foods.map(food => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={testFoodProperties} 
            disabled={!currentSpace || !selectedFood || testResults.properties.status === "running"}
          >
            Test Properties
          </Button>
          
          <TestStatus result={testResults.properties} />
          
          {testResults.properties.status === "success" && testResults.properties.data && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Properties</h3>
              <div className="max-h-60 overflow-y-auto">
                <pre className="text-xs p-2 bg-gray-100 rounded whitespace-pre-wrap">
                  {JSON.stringify(testResults.properties.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Food Search Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search Term</label>
            <Input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Enter search term"
            />
          </div>
          
          <Button 
            onClick={testSearch} 
            disabled={!currentSpace || !searchTerm || testResults.search.status === "running"}
          >
            Search Foods
          </Button>
          
          <TestStatus result={testResults.search} />
          
          {testResults.search.status === "success" && searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Search Results ({searchResults.length})</h3>
              <ul className="max-h-60 overflow-y-auto space-y-1">
                {searchResults.map(food => (
                  <li key={food.id} className="text-sm">
                    <strong>{food.name}</strong>
                    {food.description && <p className="text-gray-500 text-xs">{food.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create RPC Functions</h2>
        <p className="text-sm text-gray-600 mb-4">
          This will create helper RPC functions for hierarchical queries and search.
        </p>
        <Button onClick={createRpcFunctions}>Create RPC Functions</Button>
      </div>
    </div>
  );
};

export default FoodCatalogTester;
