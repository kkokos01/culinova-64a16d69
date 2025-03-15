
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFoodCatalogTest } from "@/hooks/useFoodCatalogTest";

import TestResultsDisplay from "./food-catalog-tests/TestResultsDisplay";
import FoodDetailsDisplay from "./food-catalog-tests/FoodDetailsDisplay";
import SearchResultsDisplay from "./food-catalog-tests/SearchResultsDisplay";
import HierarchyResultsDisplay from "./food-catalog-tests/HierarchyResultsDisplay";

const FoodCatalogTester = () => {
  const { user } = useAuth();
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
    if (user) {
      // Run tests automatically when component mounts
      runAllTests();
    }
  }, [user, runAllTests]);

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
              onRunTests={runAllTests}
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
