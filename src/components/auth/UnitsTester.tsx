
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import UnitTestResult, { TestResult } from "./units-tests/UnitTestResult";
import UnitTestDetails from "./units-tests/UnitTestDetails";
import { useUnitTestRunner } from "./units-tests/UnitTestRunner";
import { useStandardUnitsTest } from "./units-tests/StandardUnitsTest";
import { useCustomUnitsTest } from "./units-tests/CustomUnitsTest";
import { useUnitConversionTest } from "./units-tests/UnitConversionTest";
import { useTemperatureConversionTest } from "./units-tests/TemperatureConversionTest";
import { useRLSPoliciesTest } from "./units-tests/RLSPoliciesTest";

const UnitsTester = () => {
  const { user } = useAuth();
  const { currentSpace, spaces, createSpace } = useSpace();
  const { toast } = useToast();
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);

  const { 
    results, 
    loading, 
    updateTestResult, 
    runAllTests,
    ensureTestSpace 
  } = useUnitTestRunner(user?.id);

  // Initialize individual test hooks
  const standardUnitsTest = useStandardUnitsTest(
    (result) => updateTestResult(0, result), 
    0
  );
  
  const customUnitsTest = useCustomUnitsTest(
    (result) => updateTestResult(1, result), 
    1,
    () => ensureTestSpace(spaceId, currentSpace, spaces, createSpace)
  );
  
  const unitConversionTest = useUnitConversionTest(
    (result) => updateTestResult(2, result), 
    2
  );
  
  const temperatureConversionTest = useTemperatureConversionTest(
    (result) => updateTestResult(3, result), 
    3
  );
  
  const rlsPoliciesTest = useRLSPoliciesTest(
    (result) => updateTestResult(4, result), 
    4,
    () => ensureTestSpace(spaceId, currentSpace, spaces, createSpace)
  );

  useEffect(() => {
    if (currentSpace) {
      setSpaceId(currentSpace.id);
    }
  }, [currentSpace]);

  // Manually create a space for testing
  const createTestSpace = async () => {
    setCreatingSpace(true);
    try {
      const space = await createSpace("Test Space");
      if (space) {
        setSpaceId(space.id);
        toast({
          title: "Test Space Created",
          description: "A test space has been created for unit testing.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Creating Space",
        description: error.message || "Could not create a test space",
        variant: "destructive"
      });
    } finally {
      setCreatingSpace(false);
    }
  };

  // Run all tests
  const handleRunAllTests = async () => {
    await runAllTests(
      standardUnitsTest.runTest,
      customUnitsTest.runTest,
      unitConversionTest.runTest,
      temperatureConversionTest.runTest,
      rlsPoliciesTest.runTest
    );
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
            {!spaceId && (
              <Alert variant="warning" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>You need a space to run some of these tests.</span>
                  <Button 
                    onClick={createTestSpace} 
                    disabled={creatingSpace}
                    size="sm"
                    variant="outline"
                  >
                    {creatingSpace ? "Creating..." : "Create Test Space"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="mt-2 space-y-2">
                  {results.map((result, index) => (
                    <UnitTestResult key={index} result={result} index={index} />
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <UnitTestDetails results={results} />
              
              <Button 
                onClick={handleRunAllTests} 
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
