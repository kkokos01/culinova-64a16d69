
import { supabase } from "@/integrations/supabase/client";
import { TestHookResult } from "./UnitTestRunner";

export const useTemperatureConversionTest = (updateResult: (result: any) => void, index: number): TestHookResult => {
  
  const runTest = async () => {
    updateResult({ status: "running" });
    
    try {
      // Get celsius and fahrenheit units
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .in("name", ["celsius", "fahrenheit"])
        .eq("unit_type", "temperature");
      
      if (unitsError) throw unitsError;
      
      if (!units || units.length < 2) {
        throw new Error("Couldn't find temperature units for conversion test");
      }
      
      const celsiusUnit = units.find(u => u.name === "celsius");
      const fahrenheitUnit = units.find(u => u.name === "fahrenheit");
      
      if (!celsiusUnit || !fahrenheitUnit) {
        throw new Error("Missing required temperature units");
      }
      
      // Test C to F: 0°C should be 32°F
      const { data: resultCtoF, error: errorCtoF } = await supabase.rpc(
        "convert_units",
        {
          value: 0,
          from_unit_id: celsiusUnit.id,
          to_unit_id: fahrenheitUnit.id
        }
      );
      
      if (errorCtoF) throw errorCtoF;
      
      // Test F to C: 32°F should be 0°C
      const { data: resultFtoC, error: errorFtoC } = await supabase.rpc(
        "convert_units",
        {
          value: 32,
          from_unit_id: fahrenheitUnit.id,
          to_unit_id: celsiusUnit.id
        }
      );
      
      if (errorFtoC) throw errorFtoC;
      
      // Verify results
      const isCorrectCtoF = Math.abs(parseFloat(resultCtoF) - 32) < 0.1;
      const isCorrectFtoC = Math.abs(parseFloat(resultFtoC) - 0) < 0.1;
      
      if (isCorrectCtoF && isCorrectFtoC) {
        updateResult({
          status: "success",
          message: `Successfully converted temperatures: 0°C = ${resultCtoF}°F, 32°F = ${resultFtoC}°C`,
          data: { 
            celsiusToFahrenheit: { input: "0°C", output: `${resultCtoF}°F` },
            fahrenheitToCelsius: { input: "32°F", output: `${resultFtoC}°C` }
          }
        });
        return true;
      } else {
        throw new Error(`Temperature conversion results incorrect: 0°C = ${resultCtoF}°F, 32°F = ${resultFtoC}°C`);
      }
    } catch (error: any) {
      updateResult({
        status: "error",
        message: error.message || "Failed to test temperature conversion"
      });
      return false;
    }
  };

  return {
    updateResult: (result) => updateResult(result),
    runTest
  };
};
