
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import TestStatus from "./test-utils/TestStatus";
import ErrorDisplay from "./test-utils/ErrorDisplay";
import ResultDisplay from "./test-utils/ResultDisplay";
import CreateDefaultSpace from "./database-tests/CreateDefaultSpace";
import { useProfileTest } from "./database-tests/ProfileTest";
import { useSpacesTest } from "./database-tests/SpacesTest";
import { useMembershipTest } from "./database-tests/MembershipTest";
import { useRLSTest } from "./database-tests/RLSTest";

const DatabaseTester = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<{[key: string]: boolean | string}>({});
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<{[key: string]: string}>({});
  
  // Import test hooks
  const { userProfile, errorMessage: profileError, testUserProfile } = useProfileTest(user?.id);
  const { spaces, errorMessage: spacesError, testUserSpaces } = useSpacesTest(user?.id);
  const { userSpaces, errorMessage: membershipError, testSpaceMembership, fetchRawMemberships } = useMembershipTest(user?.id, spaces);
  const { errorMessage: rlsError, testRLSPolicies } = useRLSTest(user?.id);

  const runAllTests = async () => {
    if (!user) return;
    
    setLoading(true);
    setErrorMessages({});
    
    // Run tests in sequence to ensure dependencies are met
    const profileResult = await testUserProfile();
    const spacesResult = await testUserSpaces();
    
    // Only test membership if spaces test passed
    const membershipResult = spacesResult ? await testSpaceMembership() : false;
    const rlsPoliciesResult = await testRLSPolicies();
    
    const results = {
      userProfile: profileResult,
      userSpaces: spacesResult,
      spaceMembership: membershipResult,
      rlsPolicies: rlsPoliciesResult
    };
    
    setTestResults(results);
    setLoading(false);
    
    // If tests reveal issues, log details for debugging
    if (!membershipResult && spacesResult) {
      console.error("Space membership test failed despite having spaces");
      // Fetch raw data for debugging
      const rawMemberships = await fetchRawMemberships();
      console.log("Raw memberships:", rawMemberships);
    }
    
    // Collect error messages
    const errors: {[key: string]: string} = {};
    if (profileError) errors.userProfile = profileError;
    if (spacesError) errors.userSpaces = spacesError;
    if (membershipError) errors.spaceMembership = membershipError;
    if (rlsError) errors.rlsPolicies = rlsError;
    
    setErrorMessages(errors);
  };

  // Auto-run tests disabled to prevent infinite loading
// Users can manually run tests using the button below
// useEffect(() => {
//   if (user) {
//     runAllTests();
//   }
// }, [user]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Configuration Tester</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center p-4">
            Please sign in to run database tests
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Test Results</h3>
                <div className="mt-2 space-y-2">
                  <TestStatus name="User Profile Created" status={testResults.userProfile} />
                  <TestStatus name="Default Space Created" status={testResults.userSpaces} />
                  <TestStatus name="Admin Role Assigned" status={testResults.spaceMembership} />
                  <TestStatus name="RLS Policies Working" status={testResults.rlsPolicies} />
                </div>
              </div>
              
              {/* Button to create default space for existing user */}
              {testResults.userProfile && !testResults.userSpaces && user && (
                <CreateDefaultSpace userId={user.id} onSuccess={runAllTests} />
              )}
              
              {/* Display any error messages */}
              <ErrorDisplay errors={errorMessages} />
              
              <Separator />
              
              <ResultDisplay 
                title="User Profile" 
                data={userProfile} 
                emptyMessage="No profile data" 
              />
              
              <Separator />
              
              <ResultDisplay 
                title="Spaces" 
                data={spaces.length > 0 ? spaces : null} 
                emptyMessage="No spaces found" 
              />
              
              <Separator />
              
              <ResultDisplay 
                title="Space Memberships" 
                data={userSpaces.length > 0 ? userSpaces : null} 
                emptyMessage="No memberships found" 
              />
              
              <Button 
                onClick={runAllTests} 
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "Running Tests..." : "Run Tests Again"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseTester;
