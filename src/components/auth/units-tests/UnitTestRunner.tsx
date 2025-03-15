import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TestResult } from "./UnitTestResult";
import { Space } from "@/types";

export interface TestHookResult {
  updateResult: (result: Partial<TestResult>) => void;
  runTest: () => Promise<boolean>;
}

export const useUnitTestRunner = (userId: string | undefined) => {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([
    { name: "Fetch standard units", status: "idle" },
    { name: "Create and fetch custom unit", status: "idle" },
    { name: "Test unit conversion", status: "idle" },
    { name: "Test temperature conversion", status: "idle" },
    { name: "Test RLS policies", status: "idle" },
  ]);
  const [loading, setLoading] = useState(false);

  // Helper function to update a single test result
  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...result };
      return newResults;
    });
  };

  // Run all tests
  const runAllTests = async (runTest1: () => Promise<boolean>, runTest2: () => Promise<boolean>, runTest3: () => Promise<boolean>, runTest4: () => Promise<boolean>, runTest5: () => Promise<boolean>) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to run unit system tests",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Run each test sequentially
      await runTest1();
      await runTest2();
      await runTest3();
      await runTest4();
      await runTest5();
      
      const successCount = results.filter(r => r.status === "success").length;
      
      toast({
        title: `Testing Complete`,
        description: `${successCount} of ${results.length} tests passed successfully.`,
        variant: successCount === results.length ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error("Error running units tests:", error);
      toast({
        title: "Testing Error",
        description: error.message || "An error occurred while running tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a test space if needed
  const ensureTestSpace = async (spaceId: string | null, currentSpace: Space | null, spaces: Space[], createSpace: (name: string) => Promise<Space | null>): Promise<string | null> => {
    // If we already have a space, use it
    if (currentSpace) {
      return currentSpace.id;
    }
    
    // If we have spaces but no current space, use the first one
    if (spaces.length > 0) {
      return spaces[0].id;
    }
    
    // Otherwise create a new space
    try {
      const newSpace = await createSpace("Test Space");
      if (newSpace) {
        return newSpace.id;
      }
    } catch (error) {
      console.error("Error creating test space:", error);
    }
    
    return null;
  };

  return {
    results,
    loading,
    updateTestResult,
    runAllTests,
    ensureTestSpace
  };
};
