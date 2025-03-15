
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFoodCatalogTest } from "@/hooks/food-catalog/useFoodCatalogTest";

import TestResultsDisplay from "./food-catalog-tests/TestResultsDisplay";
import FoodDetailsDisplay from "./food-catalog-tests/FoodDetailsDisplay";
import SearchResultsDisplay from "./food-catalog-tests/SearchResultsDisplay";
import HierarchyResultsDisplay from "./food-catalog-tests/HierarchyResultsDisplay";

const FoodCatalogTester = () => {
  const { user } = useAuth();
  const [hasRun, setHasRun] = useState(false);
  
  const { 
    isLoading,
    testResults,
    errorMessages,
    createdFood,
    searchResults,
    hierarchyResults,
    runAllTests
  } = useFoodCatalogTest();

  useEffect(() => {
    // Only run the tests once when the component mounts and user is available
    if (user && !hasRun && !isLoading) {
      console.log("Running tests on initial mount");
      runAllTests();
      setHasRun(true);
    }
  }, [user, hasRun, isLoading, runAllTests]);

  // Handler for manual test runs
  const handleManualTestRun = () => {
    runAllTests();
    setHasRun(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Food Catalog Tester</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center p-4">
            Please sign in to run food catalog tests
          </div>
        ) : (
          <div className="space-y-6">
            <TestResultsDisplay
              testResults={testResults}
              errorMessages={errorMessages}
              isLoading={isLoading}
              onRunTests={handleManualTestRun}
            />
            
            <Separator />
            
            <FoodDetailsDisplay
              title="Create Food"
              food={createdFood}
            />
            
            <SearchResultsDisplay
              searchResults={searchResults}
              errorMessage={errorMessages.foodSearch}
            />
            
            <HierarchyResultsDisplay
              ancestors={hierarchyResults.ancestors}
              descendants={hierarchyResults.descendants}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodCatalogTester;
