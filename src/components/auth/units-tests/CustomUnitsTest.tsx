
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
      // First, get a base unit to reference - fixing query syntax
      const { data: baseUnits, error: baseUnitError } = await supabase
        .from("units")
        .select("*")
        .eq("unit_type", "volume")
        .eq("base_unit", true);
      
      if (baseUnitError) throw baseUnitError;
      
      if (!baseUnits || baseUnits.length === 0) {
        throw new Error("No base volume unit found for reference");
      }
      
      const baseUnit = baseUnits[0];
      console.log("Found base unit:", baseUnit);
      
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
      
      if (!insertData || insertData.length === 0) {
        throw new Error("Failed to create custom unit, no data returned");
      }
      
      console.log("Created custom unit:", insertData[0]);
      
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
          data: insertData[0]
        });
        return true;
      } else {
        throw new Error("Failed to retrieve the created custom unit");
      }
    } catch (error: any) {
      console.error("Custom unit test error:", error);
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
