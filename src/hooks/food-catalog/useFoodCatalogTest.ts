
import { useReducer, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpace } from "@/context/SpaceContext";
import { useAuth } from "@/context/AuthContext";

import { FoodCategory, Food } from "./types";
import { initialState, testReducer } from "./testReducer";
import { 
  verifyRpcFunctions, 
  fetchFoodCategories,
  createTestFood,
  testLtreeHierarchy,
  testFoodProperties,
  testFoodSearch
} from "./testFunctions";

export function useFoodCatalogTest() {
  const [state, dispatch] = useReducer(testReducer, initialState);
  const { toast } = useToast();
  const { currentSpace } = useSpace();
  const { user } = useAuth();
  
  // Reset all test states
  const resetTests = useCallback(() => {
    dispatch({ type: 'RESET_TESTS' });
  }, []);

  // Run all tests in sequence
  const runAllTests = useCallback(async () => {
    if (state.isTestRunning) {
      console.log("Test is already running, skipping");
      return;
    }
    
    if (!currentSpace || !user) {
      toast({
        title: "Missing requirements",
        description: "You need to have an active space to run these tests",
        variant: "destructive",
      });
      return;
    }
    
    dispatch({ type: 'RESET_TESTS' });
    
    try {
      // Test 1: Verify RPC Functions
      try {
        const rpcResult = await verifyRpcFunctions();
        dispatch({ type: 'SET_TEST_RESULT', test: 'rpcFunctions', result: rpcResult });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', test: 'rpcFunctions', message: error.message });
      }
      
      // Test 2: Fetch Food Categories
      try {
        const { categories } = await fetchFoodCategories();
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
        dispatch({ type: 'SET_TEST_RESULT', test: 'foodCategories', result: true });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', test: 'foodCategories', message: error.message });
      }
      
      // Test 3: Create Food Item
      let testFood = null;
      try {
        testFood = await createTestFood(currentSpace, user, state.categories);
        dispatch({ type: 'SET_CREATED_FOOD', payload: testFood });
        dispatch({ type: 'SET_TEST_RESULT', test: 'createFood', result: true });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', test: 'createFood', message: error.message });
      }
      
      // Only continue with hierarchy and properties tests if food was created
      if (testFood) {
        // Test 4: Test Ltree Hierarchy
        try {
          const hierarchyResults = await testLtreeHierarchy(testFood, currentSpace, user);
          dispatch({ type: 'SET_HIERARCHY_RESULTS', payload: hierarchyResults });
          dispatch({ type: 'SET_TEST_RESULT', test: 'ltreeHierarchy', result: true });
        } catch (error: any) {
          dispatch({ type: 'SET_ERROR', test: 'ltreeHierarchy', message: error.message });
        }
        
        // Test 5: Test Food Properties
        try {
          const updatedFood = await testFoodProperties(testFood);
          dispatch({ type: 'SET_CREATED_FOOD', payload: updatedFood });
          dispatch({ type: 'SET_TEST_RESULT', test: 'foodProperties', result: true });
        } catch (error: any) {
          dispatch({ type: 'SET_ERROR', test: 'foodProperties', message: error.message });
        }
      } else {
        dispatch({ type: 'SET_ERROR', test: 'ltreeHierarchy', message: "Test skipped: No test food available" });
        dispatch({ type: 'SET_ERROR', test: 'foodProperties', message: "Test skipped: No test food available" });
      }
      
      // Test 6: Test Food Search
      try {
        const searchResults = await testFoodSearch(currentSpace, user);
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults });
        dispatch({ type: 'SET_TEST_RESULT', test: 'foodSearch', result: true });
      } catch (error: any) {
        dispatch({ type: 'SET_ERROR', test: 'foodSearch', message: error.message });
      }
    } catch (error: any) {
      console.error("Unexpected error running tests:", error);
      toast({
        title: "Test Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'TEST_COMPLETE' });
      
      // Log final results for debugging
      console.log("Final test results:", state.testResults);
      console.log("Error messages:", state.errorMessages);
    }
  }, [state.isTestRunning, state.categories, currentSpace, user, toast]);

  return {
    isLoading: state.isLoading,
    testResults: state.testResults,
    errorMessages: state.errorMessages,
    categories: state.categories,
    createdFood: state.createdFood,
    searchResults: state.searchResults,
    hierarchyResults: state.hierarchyResults,
    runAllTests
  };
}

// Re-export types for use in components
export type { Food, FoodCategory } from './types';
