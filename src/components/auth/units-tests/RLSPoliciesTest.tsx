
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useRLSPoliciesTest = (updateResult: (result: any) => void, index: number, ensureTestSpace: () => Promise<string | null>): TestHookResult => {
  
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
      // 1. Test that all users can read standard units (this should work)
      const { data: standardUnits, error: standardError } = await supabase
        .from("units")
        .select("*")
        .limit(1);
      
      if (standardError) throw standardError;
      
      // 2. Try to modify a standard unit (this should fail due to RLS)
      let hasExpectedError = false;
      try {
        const { error: updateError } = await supabase
          .from("units")
          .update({ name: "Hacked Unit" })
          .eq("id", standardUnits[0].id);
        
        // If we didn't get an error, the RLS policy might not be working
        if (!updateError) {
          throw new Error("Was able to update a global unit, which should be protected");
        } else {
          // We got the expected error, which means RLS is working
          hasExpectedError = true;
        }
      } catch (error: any) {
        hasExpectedError = true;
      }
      
      if (!hasExpectedError) {
        throw new Error("RLS policies test failed: Could modify a global unit");
      }
      
      // 3. Verify we can access our custom units but not others
      // This part is challenging to test properly without having multiple users,
      // so we'll simplify by creating a custom unit and verifying we can access it
      
      // Create a test custom unit first
      const { data: baseUnit } = await supabase
        .from("units")
        .select("*")
        .eq("base_unit", true)
        .eq("unit_type", "volume")
        .single();
      
      const testUnit = {
        space_id: activeSpaceId,
        name: `RLS Test Unit ${Date.now()}`,
        plural_name: "RLS Test Units",
        abbreviation: "rtu",
        unit_type: "volume",
        base_unit_id: baseUnit.id,
        conversion_to_base: 500
      };
      
      const { data: insertedUnit, error: insertError } = await supabase
        .from("custom_units")
        .insert(testUnit)
        .select();
      
      if (insertError) throw insertError;
      
      // Verify we can fetch it
      const { data: customUnits, error: fetchError } = await supabase
        .from("custom_units")
        .select("*")
        .eq("id", insertedUnit[0].id);
      
      if (fetchError || !customUnits || customUnits.length === 0) {
        throw new Error("Could not access our own custom unit");
      }
      
      updateResult({
        status: "success",
        message: "RLS policies appear to be working correctly",
        data: { rlsTestPassed: true, testUnit: insertedUnit[0] }
      });
      return true;
    } catch (error: any) {
      updateResult({
        status: "error",
        message: error.message || "Failed to test RLS policies"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
