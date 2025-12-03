import { useState, useCallback, useRef } from 'react';
import { aiRecipeGenerator, AIRecipeRequest, AIRecipeModificationRequest, AIRecipeResponse, AIRecipeError } from '@/services/ai/recipeGenerator';
import { imageGenerator, ImageGenerationRequest, ImageGenerationResponse, ImageGenerationError } from '@/services/ai/imageGenerator';

export type AIOperationType = 'recipe' | 'image' | 'modification';

export interface AIOperation {
  id: string;
  type: AIOperationType;
  status: 'loading' | 'success' | 'error';
  result?: any;
  error?: Error;
  startTime: number;
  endTime?: number;
  request?: any; // Store original request for retry functionality
}

/**
 * Unified AI hook for managing all AI operations
 * Provides consistent loading states, error handling, and operation tracking
 */
export const useAI = (options: UseAIOptions = {}) => {
  const operationsRef = useRef<Map<string, AIOperation>>(new Map());
  const [, forceUpdate] = useState({}); // Force re-render when operations change
  
  const operationCounter = useRef(0);

  /**
   * Trigger re-render when operations change
   */
  const updateOperations = useCallback(() => {
    forceUpdate({});
  }, []);

  /**
   * Create a new operation and track it
   */
  const createOperation = useCallback((type: AIOperationType, request?: any): string => {
    const id = `${type}-${Date.now()}-${operationCounter.current++}`;
    const operation: AIOperation = {
      id,
      type,
      status: 'loading',
      startTime: Date.now(),
      request
    };

    operationsRef.current.set(id, operation);
    updateOperations();
    return id;
  }, [updateOperations]);

  /**
   * Update operation status and result
   */
  const updateOperation = useCallback((id: string, updates: Partial<AIOperation>) => {
    const operations = operationsRef.current;
    const current = operations.get(id);
    if (!current) return;

    const updated = { ...current, ...updates };
    operations.set(id, updated);
    updateOperations();
  }, [updateOperations]);

  /**
   * Generate recipe using AI
   */
  const generateRecipe = useCallback(async (request: AIRecipeRequest): Promise<AIRecipeResponse | AIRecipeError> => {
    const operationId = createOperation('recipe', request);

    try {
      const result = await aiRecipeGenerator.generateRecipe(request);
      
      updateOperation(operationId, {
        status: 'success',
        result,
        endTime: Date.now()
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Recipe generation failed');
      
      updateOperation(operationId, {
        status: 'error',
        error: errorObj,
        endTime: Date.now()
      });

      throw errorObj;
    }
  }, [createOperation, updateOperation]);

  /**
   * Modify existing recipe using AI
   */
  const modifyRecipe = useCallback(async (request: AIRecipeModificationRequest): Promise<AIRecipeResponse | AIRecipeError> => {
    const operationId = createOperation('modification', request);

    try {
      const result = await aiRecipeGenerator.modifyRecipe(request);
      
      updateOperation(operationId, {
        status: 'success',
        result,
        endTime: Date.now()
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Recipe modification failed');
      
      updateOperation(operationId, {
        status: 'error',
        error: errorObj,
        endTime: Date.now()
      });

      throw errorObj;
    }
  }, [createOperation, updateOperation]);

  /**
   * Generate recipe image using AI
   */
  const generateImage = useCallback(async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
    const operationId = createOperation('image', request);

    try {
      const result = await imageGenerator.generateRecipeImage(request);
      
      updateOperation(operationId, {
        status: 'success',
        result,
        endTime: Date.now()
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Image generation failed');
      
      updateOperation(operationId, {
        status: 'error',
        error: errorObj,
        endTime: Date.now()
      });

      throw errorObj;
    }
  }, [createOperation, updateOperation]);

  /**
   * Get derived state operations (calculated on each render)
   */
  const getDerivedState = useCallback(() => {
    const operations = Array.from(operationsRef.current.values());
    const loadingOperations = operations.filter(op => op.status === 'loading');
    const errors = operations.filter(op => op.status === 'error').map(op => op.error).filter(Boolean) as Error[];
    
    const isGeneratingRecipe = loadingOperations.some(op => op.type === 'recipe');
    const isModifyingRecipe = loadingOperations.some(op => op.type === 'modification');
    const isGeneratingImage = loadingOperations.some(op => op.type === 'image');
    
    const getLastOperation = (type: AIOperationType): AIOperation | undefined => {
      return operations
        .filter(op => op.type === type)
        .sort((a, b) => b.startTime - a.startTime)[0];
    };

    return {
      operations: new Map(operationsRef.current),
      loadingOperations: new Map(loadingOperations.map(op => [op.id, op])),
      errors: new Map(errors.map((error, index) => [`error-${index}`, error])),
      isLoading: loadingOperations.length > 0,
      isGeneratingRecipe,
      isModifyingRecipe,
      isGeneratingImage,
      getLastOperation,
      recipeError: getLastOperation('recipe')?.error,
      modificationError: getLastOperation('modification')?.error,
      imageError: getLastOperation('image')?.error,
    };
  }, []); // Empty dependency array - we manually trigger updates

  /**
   * Check if any operation of a specific type is loading
   */
  const isLoading = useCallback((type?: AIOperationType): boolean => {
    const state = getDerivedState();
    
    if (!type) {
      return state.isLoading;
    }
    
    switch (type) {
      case 'recipe': return state.isGeneratingRecipe;
      case 'modification': return state.isModifyingRecipe;
      case 'image': return state.isGeneratingImage;
      default: return false;
    }
  }, [getDerivedState]);

  /**
   * Clear completed operations
   */
  const clearCompleted = useCallback(() => {
    const operations = operationsRef.current;
    const loadingOps = Array.from(operations.values()).filter(op => op.status === 'loading');
    operationsRef.current = new Map(loadingOps.map(op => [op.id, op]));
    updateOperations();
  }, [updateOperations]);

  /**
   * Retry a failed operation
   */
  const retryOperation = useCallback(async (operationId: string): Promise<any> => {
    const operations = operationsRef.current;
    const operation = operations.get(operationId);
    
    if (!operation || operation.status !== 'error' || !operation.request) {
      throw new Error('Cannot retry operation: not found, not failed, or no request stored');
    }

    // Remove the failed operation
    operations.delete(operationId);

    // Retry based on operation type
    switch (operation.type) {
      case 'recipe':
        return generateRecipe(operation.request as AIRecipeRequest);
      case 'modification':
        return modifyRecipe(operation.request as AIRecipeModificationRequest);
      case 'image':
        return generateImage(operation.request as ImageGenerationRequest);
      default:
        throw new Error('Unknown operation type for retry');
    }
  }, [generateRecipe, modifyRecipe, generateImage]);

  return {
    // Operations
    generateRecipe,
    modifyRecipe,
    generateImage,
    
    // State (calculated fresh on each render)
    ...getDerivedState(),
    
    // Helpers
    isLoading,
    clearCompleted,
    retryOperation,
  };
};

export interface UseAIOptions {
  onSuccess?: (operation: AIOperation) => void;
  onError?: (operation: AIOperation) => void;
  enableRetry?: boolean;
}
