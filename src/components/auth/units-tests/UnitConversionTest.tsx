
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useUnitConversionTest = (updateResult: (result: any) => void, index: number): TestHookResult => {
  
  const runTest = async () => {
    updateResult({ status: "running" });
    
    try {
      // Get gram and ounce units for conversion with proper query
      const { data: massUnits, error: massUnitsError } = await supabase
        .from("units")
        .select("*")
        .eq("unit_type", "mass");
      
      if (massUnitsError) throw massUnitsError;
      
      if (!massUnits || massUnits.length < 2) {
        throw new Error("Couldn't find enough mass units for conversion test");
      }
      
      // Find units we need in the result set
      const gramUnit = massUnits.find(u => u.name === "gram" || u.name === "milligram" || u.name === "kilogram");
      const ounceUnit = massUnits.find(u => u.name === "ounce" || u.name === "pound");
      
      if (!gramUnit) {
        throw new Error("Could not find any metric mass unit (gram, milligram, kilogram)");
      }
      
      if (!ounceUnit) {
        throw new Error("Could not find any imperial mass unit (ounce, pound)");
      }
      
      console.log("Found units for conversion test:", { 
        metricUnit: gramUnit.name, 
        imperialUnit: ounceUnit.name 
      });
      
      // Test direct conversion between units if available
      try {
        const { data: conversionResult, error: conversionError } = await supabase.rpc(
          "convert_units",
          {
            value: 100,
            from_unit_id: gramUnit.id,
            to_unit_id: ounceUnit.id
          }
        );
        
        if (conversionError) throw conversionError;
        
        // Verify result
        updateResult({
          status: "success",
          message: `Successfully converted 100 ${gramUnit.name} to ${conversionResult} ${ounceUnit.name}`,
          data: { 
            input: `100 ${gramUnit.name}`, 
            output: `${parseFloat(conversionResult).toFixed(2)} ${ounceUnit.name}` 
          }
        });
        return true;
      } catch (error: any) {
        console.error("Conversion error:", error);
        throw new Error(`Failed to convert between ${gramUnit.name} and ${ounceUnit.name}: ${error.message}`);
      }
      
    } catch (error: any) {
      console.error("Unit conversion test error:", error);
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
