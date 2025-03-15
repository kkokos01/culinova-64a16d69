
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useUnitConversionTest = (updateResult: (result: any) => void, index: number): TestHookResult => {
  
  const runTest = async () => {
    updateResult({ status: "running" });
    
    try {
      // Get gram and ounce units for conversion
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .in("name", ["gram", "ounce"])
        .in("unit_type", ["mass"]);
      
      if (unitsError) throw unitsError;
      
      if (!units || units.length < 2) {
        throw new Error("Couldn't find necessary units for conversion test");
      }
      
      const gramUnit = units.find(u => u.name === "gram");
      const ounceUnit = units.find(u => u.name === "ounce");
      
      if (!gramUnit || !ounceUnit) {
        throw new Error("Missing required units for conversion test");
      }
      
      // Test SQL function for unit conversion
      const { data: conversionResult, error: conversionError } = await supabase.rpc(
        "convert_units",
        {
          value: 100,
          from_unit_id: gramUnit.id,
          to_unit_id: ounceUnit.id
        }
      );
      
      if (conversionError) throw conversionError;
      
      // Verify result is approximately correct (100g is about 3.53 oz)
      const expected = 3.53;
      const actual = parseFloat(conversionResult);
      const isCloseEnough = Math.abs(actual - expected) < 0.1;
      
      if (isCloseEnough) {
        updateResult({
          status: "success",
          message: `Successfully converted 100g to ${actual.toFixed(2)}oz (expected ~${expected})`,
          data: { input: "100g", output: `${actual.toFixed(2)}oz` }
        });
        return true;
      } else {
        throw new Error(`Conversion result ${actual} differs significantly from expected ${expected}`);
      }
    } catch (error: any) {
      updateResult({
        status: "error",
        message: error.message || "Failed to test unit conversion"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
