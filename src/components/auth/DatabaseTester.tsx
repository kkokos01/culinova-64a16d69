
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserProfile, Space, UserSpace } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useSpace } from "@/context/SpaceContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const DatabaseTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshSpaces } = useSpace();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const [testResults, setTestResults] = useState<{[key: string]: boolean | string}>({});
  const [loading, setLoading] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [errorMessages, setErrorMessages] = useState<{[key: string]: string}>({});

  // Test 1: Check if user profile exists
  const testUserProfile = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        setErrorMessages(prev => ({ ...prev, userProfile: error.message }));
        throw error;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      console.error("Error testing user profile:", error);
      setErrorMessages(prev => ({ ...prev, userProfile: error.message }));
      return false;
    }
  };

  // Test 2: Check if user has at least one space and a default space
  const testUserSpaces = async () => {
    if (!user) return false;
    
    try {
      // With the new RLS policies, we can directly query spaces
      const { data: userSpaces, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("is_active", true);
      
      if (spacesError) {
        console.error("Error testing user spaces:", spacesError);
        setErrorMessages(prev => ({ ...prev, userSpaces: spacesError.message }));
        throw spacesError;
      }
      
      setSpaces(userSpaces as Space[] || []);
      return userSpaces && userSpaces.length > 0 && userSpaces.some(space => space.is_default);
    } catch (error: any) {
      console.error("Error testing user spaces:", error);
      setErrorMessages(prev => ({ ...prev, userSpaces: error.message }));
      return false;
    }
  };

  // Test 3: Check if user has admin access to their space
  const testSpaceMembership = async () => {
    if (!user || spaces.length === 0) return false;
    
    try {
      // Find the default space
      const defaultSpace = spaces.find(space => space.is_default) || spaces[0];
      
      const { data, error } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("space_id", defaultSpace.id)
        .eq("is_active", true);
      
      if (error) {
        setErrorMessages(prev => ({ ...prev, spaceMembership: error.message }));
        throw error;
      }
      
      setUserSpaces(data as UserSpace[]);
      
      if (data.length === 0) return false;
      
      // Check if user is admin of their default space
      const isAdmin = data.some(membership => membership.role === 'admin');
      
      if (!isAdmin) {
        console.log("User has membership but not admin role:", data);
      }
      
      return isAdmin;
    } catch (error: any) {
      console.error("Error testing space membership:", error);
      setErrorMessages(prev => ({ ...prev, spaceMembership: error.message }));
      return false;
    }
  };

  // Test 4: Test RLS policies by trying to access another user's data
  const testRLSPolicies = async () => {
    if (!user) return false;
    
    try {
      // Try to query any user profiles that don't belong to the current user
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .neq("user_id", user.id)
        .limit(1);
      
      if (error) {
        // If we get a permission error, RLS is working correctly
        return error.message.includes("permission") || error.message.includes("policy");
      }
      
      // If we can see other users' data, RLS is not working correctly
      return data.length === 0;
    } catch (error: any) {
      console.error("Error testing RLS policies:", error);
      return error.message.includes("permission") || error.message.includes("policy");
    }
  };

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
      const { data: rawMemberships } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", user.id);
      console.log("Raw memberships:", rawMemberships);
    }
  };

  // Function to create a default space for the user
  const createDefaultSpace = async () => {
    if (!user) return;
    
    setCreatingSpace(true);
    setErrorMessages({});
    
    try {
      console.log("Creating default space for user:", user.id);
      
      // Call the Supabase function to create a default space
      const { data, error } = await supabase.rpc(
        'create_space_for_existing_user',
        { user_id_param: user.id }
      );
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Failed to create default space - no space ID returned");
      }
      
      console.log("Default space created successfully, space_id:", data);
      
      toast({
        title: "Space created",
        description: "Default space has been created successfully!",
      });
      
      // Refresh spaces in the SpaceContext
      await refreshSpaces();
      
      // Wait a moment for the database to update
      setTimeout(async () => {
        // Re-run the tests to update the UI
        await runAllTests();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error creating default space:", error);
      setErrorMessages(prev => ({ ...prev, createSpace: error.message }));
      
      toast({
        title: "Error creating space",
        description: error.message || "Could not create default space",
        variant: "destructive",
      });
    } finally {
      setCreatingSpace(false);
    }
  };

  useEffect(() => {
    if (user) {
      runAllTests();
    }
  }, [user]);

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
                  <div className="flex justify-between items-center py-1">
                    <span>User Profile Created:</span>
                    <span className={`flex items-center ${testResults.userProfile ? "text-green-500" : "text-red-500"}`}>
                      {testResults.userProfile ? (
                        <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
                      ) : (
                        <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Default Space Created:</span>
                    <span className={`flex items-center ${testResults.userSpaces ? "text-green-500" : "text-red-500"}`}>
                      {testResults.userSpaces ? (
                        <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
                      ) : (
                        <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Admin Role Assigned:</span>
                    <span className={`flex items-center ${testResults.spaceMembership ? "text-green-500" : "text-red-500"}`}>
                      {testResults.spaceMembership ? (
                        <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
                      ) : (
                        <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>RLS Policies Working:</span>
                    <span className={`flex items-center ${testResults.rlsPolicies ? "text-green-500" : "text-red-500"}`}>
                      {testResults.rlsPolicies ? (
                        <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
                      ) : (
                        <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Button to create default space for existing user */}
              {testResults.userProfile && !testResults.userSpaces && (
                <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Create Default Space</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Your account was created before space functionality was added. 
                    Click the button below to create a default space.
                  </p>
                  <Button 
                    onClick={createDefaultSpace} 
                    disabled={creatingSpace}
                    className="w-full"
                  >
                    {creatingSpace ? "Creating Space..." : "Create Default Space"}
                  </Button>
                  {errorMessages.createSpace && (
                    <p className="text-xs text-red-500 mt-2">
                      Error: {errorMessages.createSpace}
                    </p>
                  )}
                </div>
              )}
              
              {/* Display any error messages */}
              {Object.keys(errorMessages).length > 0 && (
                <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Troubleshooting Information:</h4>
                  <ul className="text-xs text-red-700 mt-1 list-disc pl-5">
                    {Object.entries(errorMessages).map(([key, message]) => (
                      <li key={key}>{key}: {message}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">User Profile</h3>
                {userProfile ? (
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(userProfile, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-500 italic">No profile data</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Spaces</h3>
                {spaces.length > 0 ? (
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(spaces, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-500 italic">No spaces found</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Space Memberships</h3>
                {userSpaces.length > 0 ? (
                  <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(userSpaces, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-500 italic">No memberships found</p>
                )}
              </div>
              
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
