
import { FoodCatalogTestState, FoodCatalogTestAction } from './types';

export const initialState: FoodCatalogTestState = {
  isLoading: false,
  isTestRunning: false,
  testResults: {},
  errorMessages: {},
  categories: [],
  createdFood: null,
  searchResults: [],
  hierarchyResults: { ancestors: [], descendants: [] }
};

export function testReducer(state: FoodCatalogTestState, action: FoodCatalogTestAction): FoodCatalogTestState {
  switch (action.type) {
    case 'TEST_STARTED':
      return {
        ...state,
        isLoading: true,
        isTestRunning: true
      };
    
    case 'TEST_COMPLETE':
      return {
        ...state,
        isLoading: false,
        isTestRunning: false
      };
    
    case 'RESET_TESTS':
      return {
        ...initialState,
        isLoading: true,
        isTestRunning: true
      };
    
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload
      };
    
    case 'SET_CREATED_FOOD':
      return {
        ...state,
        createdFood: action.payload
      };
    
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload
      };
    
    case 'SET_HIERARCHY_RESULTS':
      return {
        ...state,
        hierarchyResults: action.payload
      };
    
    case 'SET_TEST_RESULT':
      return {
        ...state,
        testResults: {
          ...state.testResults,
          [action.test]: action.result
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errorMessages: {
          ...state.errorMessages,
          [action.test]: action.message
        },
        testResults: {
          ...state.testResults,
          [action.test]: false
        }
      };
    
    default:
      return state;
  }
}
