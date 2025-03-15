
import { supabase } from "@/integrations/supabase/client";

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
  space_id: string;
  created_by: string;
}

export interface TestResults {
  rpcFunctions?: boolean | string;
  foodCategories?: boolean | string;
  createFood?: boolean | string;
  ltreeHierarchy?: boolean | string;
  foodProperties?: boolean | string;
  foodSearch?: boolean | string;
  [key: string]: boolean | string | undefined;  // Add index signature
}

export interface ErrorMessages {
  rpcFunctions?: string;
  foodCategories?: string;
  createFood?: string;
  ltreeHierarchy?: string;
  foodProperties?: string;
  foodSearch?: string;
  [key: string]: string | undefined;  // Add index signature
}

export interface HierarchyResults {
  ancestors: Food[];
  descendants: Food[];
}

export interface FoodCatalogTestState {
  isLoading: boolean;
  isTestRunning: boolean;
  testResults: TestResults;
  errorMessages: ErrorMessages;
  categories: FoodCategory[];
  createdFood: Food | null;
  searchResults: Food[];
  hierarchyResults: HierarchyResults;
}

export type FoodCatalogTestAction = 
  | { type: 'TEST_STARTED' }
  | { type: 'TEST_COMPLETE' }
  | { type: 'RESET_TESTS' }
  | { type: 'SET_CATEGORIES', payload: FoodCategory[] }
  | { type: 'SET_CREATED_FOOD', payload: Food }
  | { type: 'SET_SEARCH_RESULTS', payload: Food[] }
  | { type: 'SET_HIERARCHY_RESULTS', payload: HierarchyResults }
  | { type: 'SET_TEST_RESULT', test: keyof TestResults, result: boolean | string }
  | { type: 'SET_ERROR', test: keyof ErrorMessages, message: string };
