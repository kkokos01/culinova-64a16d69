
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useStandardUnitsTest = (updateResult: (result: any) => void, index: number): TestHookResult => {
  
  const runTest = async () => {
    updateResult({ status: "running" });
    
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .limit(10);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        updateResult({
          status: "success",
          message: `Successfully fetched ${data.length} standard units`,
          data
        });
        return true;
      } else {
        throw new Error("No standard units found");
      }
    } catch (error: any) {
      updateResult({
        status: "error",
        message: error.message || "Failed to fetch standard units"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
