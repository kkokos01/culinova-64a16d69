
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
      
      console.log("Found mass units:", massUnits.map(u => u.name));
      
      // Find units we need in the result set
      const gramUnit = massUnits.find(u => 
        u.measurement_system === 'metric' && 
        (u.name === "gram" || u.name === "milligram" || u.name === "kilogram")
      );
      
      const ounceUnit = massUnits.find(u => 
        u.measurement_system === 'imperial' && 
        (u.name === "ounce" || u.name === "pound")
      );
      
      if (!gramUnit) {
        throw new Error("Could not find any metric mass unit (gram, milligram, kilogram)");
      }
      
      if (!ounceUnit) {
        throw new Error("Could not find any imperial mass unit (ounce, pound)");
      }
      
      console.log("Found units for conversion test:", { 
        metricUnit: gramUnit.name, 
        imperialUnit: ounceUnit.name,
        metricUnitId: gramUnit.id,
        imperialUnitId: ounceUnit.id
      });
      
      // Try to find if there's a direct conversion defined
      const { data: directConversions, error: convError } = await supabase
        .from("unit_conversions")
        .select("*")
        .or(`from_unit_id.eq.${gramUnit.id},to_unit_id.eq.${gramUnit.id}`)
        .or(`from_unit_id.eq.${ounceUnit.id},to_unit_id.eq.${ounceUnit.id}`);
        
      if (convError) {
        console.error("Error checking for direct conversions:", convError);
      } else if (directConversions && directConversions.length > 0) {
        console.log("Found existing conversions:", directConversions);
      } else {
        console.log("No direct conversions found, will rely on base unit conversions");
      }
      
      // Test direct conversion between units
      try {
        // Use named parameters to avoid ambiguity in the SQL function
        // This is the key fix - use p_from_unit_id instead of from_unit_id to avoid ambiguity
        const conversionParams = {
          p_value: 100,
          p_from_unit_id: gramUnit.id,
          p_to_unit_id: ounceUnit.id,
          p_food_id: null
        };
        
        console.log("Calling convert_units with params:", conversionParams);
        
        const { data: conversionResult, error: conversionError } = await supabase.rpc(
          "convert_units",
          conversionParams
        );
        
        if (conversionError) {
          console.error("Conversion error:", conversionError);
          throw conversionError;
        }
        
        console.log("Conversion succeeded:", conversionResult);
        
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
