
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useCustomUnitsTest = (updateResult: (result: any) => void, index: number, ensureTestSpace: () => Promise<string | null>): TestHookResult => {
  
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
      // First, get a base unit to reference
      const { data: baseUnit, error: baseUnitError } = await supabase
        .from("units")
        .select("*")
        .eq("base_unit", true)
        .eq("unit_type", "volume")
        .single();
      
      if (baseUnitError) throw baseUnitError;
      
      if (!baseUnit) {
        throw new Error("No base unit found for reference");
      }
      
      // Create a test custom unit
      const testUnit = {
        space_id: activeSpaceId,
        name: `Test Cup ${Date.now()}`,
        plural_name: "Test Cups",
        abbreviation: "tc",
        unit_type: "volume",
        base_unit_id: baseUnit.id,
        conversion_to_base: 236.588, // Roughly a cup in ml
      };
      
      // Check if a similar test unit already exists and delete it if needed
      const { data: existingUnits, error: existingError } = await supabase
        .from("custom_units")
        .select("*")
        .eq("space_id", activeSpaceId)
        .ilike("name", "Test Cup%");
        
      if (!existingError && existingUnits && existingUnits.length > 0) {
        // Delete existing test units to prevent accumulation
        for (const unit of existingUnits) {
          await supabase
            .from("custom_units")
            .delete()
            .eq("id", unit.id);
        }
      }
      
      // Insert the new custom unit
      const { data: insertData, error: insertError } = await supabase
        .from("custom_units")
        .insert(testUnit)
        .select();
      
      if (insertError) throw insertError;
      
      // Verify we can fetch it back
      const { data: customUnits, error: fetchError } = await supabase
        .from("custom_units")
        .select("*")
        .eq("space_id", activeSpaceId);
      
      if (fetchError) throw fetchError;
      
      if (customUnits && customUnits.length > 0) {
        updateResult({
          status: "success",
          message: `Successfully created and fetched custom unit`,
          data: insertData
        });
        return true;
      } else {
        throw new Error("Failed to retrieve the created custom unit");
      }
    } catch (error: any) {
      updateResult({
        status: "error",
        message: error.message || "Failed to test custom units"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
