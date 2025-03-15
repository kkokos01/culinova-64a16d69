
import { TestStatus } from "@/components/auth/test-utils/TestStatus";
import ErrorDisplay from "@/components/auth/test-utils/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { TestResults, ErrorMessages } from "@/hooks/food-catalog/types";

interface TestResultsDisplayProps {
  testResults: TestResults;
  errorMessages: ErrorMessages;
  isLoading: boolean;
  onRunTests: () => void;
}

const TestResultsDisplay = ({
  testResults,
  errorMessages,
  isLoading,
  onRunTests
}: TestResultsDisplayProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Test Results</h3>
        <div className="mt-2 space-y-2">
          <TestStatus 
            name="Verify RPC Functions" 
            status={testResults.rpcFunctions} 
          />
          <TestStatus 
            name="Fetch Food Categories" 
            status={testResults.foodCategories} 
          />
          <TestStatus 
            name="Create Food Item" 
            status={testResults.createFood} 
          />
          <TestStatus 
            name="Test Ltree Hierarchy" 
            status={testResults.ltreeHierarchy} 
          />
          <TestStatus 
            name="Test Food Properties" 
            status={testResults.foodProperties} 
          />
          <TestStatus 
            name="Test Food Search" 
            status={testResults.foodSearch} 
          />
        </div>
      </div>
      
      <ErrorDisplay errors={errorMessages as Record<string, string>} />
      
      <Button 
        onClick={onRunTests} 
        disabled={isLoading}
        className="w-full mt-4"
      >
        {isLoading ? "Running Tests..." : "Run Tests"}
      </Button>
    </div>
  );
};

export default TestResultsDisplay;
