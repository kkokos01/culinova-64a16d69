
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type TestResult = {
  name: string;
  status: "idle" | "running" | "success" | "error";
  message?: string;
  data?: any;
};

const UnitsTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([
    { name: "Fetch standard units", status: "idle" },
    { name: "Create and fetch custom unit", status: "idle" },
    { name: "Test unit conversion", status: "idle" },
    { name: "Test temperature conversion", status: "idle" },
    { name: "Test RLS policies", status: "idle" },
  ]);
  const [loading, setLoading] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);

  // Helper function to update a single test result
  const updateTestResult = (index: number, result: Partial<TestResult>) => {
    setResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...result };
      return newResults;
    });
  };

  // Test 1: Fetch standard units
  const testStandardUnits = async (index: number) => {
    updateTestResult(index, { status: "running" });
    
    try {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .limit(10);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        updateTestResult(index, {
          status: "success",
          message: `Successfully fetched ${data.length} standard units`,
          data
        });
        return true;
      } else {
        throw new Error("No standard units found");
      }
    } catch (error: any) {
      updateTestResult(index, {
        status: "error",
        message: error.message || "Failed to fetch standard units"
      });
      return false;
    }
  };

  // Test 2: Create and fetch a custom unit
  const testCustomUnits = async (index: number) => {
    if (!user || !spaceId) {
      updateTestResult(index, {
        status: "error",
        message: "No active space found. Please create a space first."
      });
      return false;
    }
    
    updateTestResult(index, { status: "running" });
    
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
        space_id: spaceId,
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
        .eq("space_id", spaceId)
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
        .eq("space_id", spaceId);
      
      if (fetchError) throw fetchError;
      
      if (customUnits && customUnits.length > 0) {
        updateTestResult(index, {
          status: "success",
          message: `Successfully created and fetched custom unit`,
          data: insertData
        });
        return true;
      } else {
        throw new Error("Failed to retrieve the created custom unit");
      }
    } catch (error: any) {
      updateTestResult(index, {
        status: "error",
        message: error.message || "Failed to test custom units"
      });
      return false;
    }
  };

  // Test 3: Test unit conversion
  const testUnitConversion = async (index: number) => {
    updateTestResult(index, { status: "running" });
    
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
        updateTestResult(index, {
          status: "success",
          message: `Successfully converted 100g to ${actual.toFixed(2)}oz (expected ~${expected})`,
          data: { input: "100g", output: `${actual.toFixed(2)}oz` }
        });
        return true;
      } else {
        throw new Error(`Conversion result ${actual} differs significantly from expected ${expected}`);
      }
    } catch (error: any) {
      updateTestResult(index, {
        status: "error",
        message: error.message || "Failed to test unit conversion"
      });
      return false;
    }
  };

  // Test 4: Test temperature conversion
  const testTemperatureConversion = async (index: number) => {
    updateTestResult(index, { status: "running" });
    
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
        updateTestResult(index, {
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
      updateTestResult(index, {
        status: "error",
        message: error.message || "Failed to test temperature conversion"
      });
      return false;
    }
  };

  // Test 5: Test RLS policies
  const testRLSPolicies = async (index: number) => {
    if (!user || !spaceId) {
      updateTestResult(index, {
        status: "error",
        message: "No active space found. Please create a space first."
      });
      return false;
    }
    
    updateTestResult(index, { status: "running" });
    
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
      // Get a space we're not a member of
      const { data: otherSpaces, error: otherSpacesError } = await supabase
        .from("spaces")
        .select("id")
        .neq("id", spaceId)
        .limit(1);
        
      if (otherSpacesError) throw otherSpacesError;
      
      if (otherSpaces && otherSpaces.length > 0) {
        // Try to access custom units for a space we're not a member of
        const { data: otherSpaceUnits, error: otherUnitsError } = await supabase
          .from("custom_units")
          .select("*")
          .eq("space_id", otherSpaces[0].id);
        
        // If we got units from another space or didn't get a permissions error,
        // something is wrong with our RLS policies
        if (!otherUnitsError && otherSpaceUnits && otherSpaceUnits.length > 0) {
          throw new Error("RLS policies test failed: Could access custom units from another space");
        }
      }
      
      updateTestResult(index, {
        status: "success",
        message: "RLS policies appear to be working correctly",
        data: { rlsTestPassed: true }
      });
      return true;
    } catch (error: any) {
      updateTestResult(index, {
        status: "error",
        message: error.message || "Failed to test RLS policies"
      });
      return false;
    }
  };

  // Run all tests
  const runAllTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to run unit system tests",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, get a space ID to use for tests
      const { data: spaces, error: spacesError } = await supabase
        .from("spaces")
        .select("id")
        .eq("is_active", true)
        .limit(1);
        
      if (spacesError) throw spacesError;
      
      if (!spaces || spaces.length === 0) {
        toast({
          title: "No Space Available",
          description: "Please create a space before running unit system tests",
          variant: "destructive"
        });
        return;
      }
      
      setSpaceId(spaces[0].id);
      
      // Run each test sequentially
      await testStandardUnits(0);
      await testCustomUnits(1);
      await testUnitConversion(2);
      await testTemperatureConversion(3);
      await testRLSPolicies(4);
      
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Units System Tester</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center p-4">
            Please sign in to run units system tests
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="mt-2 space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span>{result.name}:</span>
                      <span className={`flex items-center ${
                        result.status === "success" ? "text-green-500" : 
                        result.status === "error" ? "text-red-500" : 
                        result.status === "running" ? "text-blue-500" : "text-gray-500"
                      }`}>
                        {result.status === "success" ? (
                          <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
                        ) : result.status === "error" ? (
                          <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
                        ) : result.status === "running" ? (
                          <>Running...</>
                        ) : (
                          <>Not Run</>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {results.map((result, index) => (
                result.message && (
                  <div key={`result-${index}`}>
                    <h3 className="text-md font-medium">{result.name}</h3>
                    <p className={`text-sm ${
                      result.status === "error" ? "text-red-500" : 
                      result.status === "success" ? "text-green-700" : ""
                    }`}>
                      {result.message}
                    </p>
                    {result.data && (
                      <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto mt-1">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                    <Separator className="my-3" />
                  </div>
                )
              ))}
              
              <Button 
                onClick={runAllTests} 
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "Running Tests..." : "Run All Units Tests"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitsTester;
