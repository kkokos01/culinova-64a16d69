
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserProfile, Space, UserSpace } from "@/types";
import { useToast } from "@/hooks/use-toast";

const DatabaseTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [userSpaces, setUserSpaces] = useState<UserSpace[]>([]);
  const [testResults, setTestResults] = useState<{[key: string]: boolean | string}>({});
  const [loading, setLoading] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);

  // Test 1: Check if user profile exists
  const testUserProfile = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data as UserProfile);
      return !!data;
    } catch (error) {
      console.error("Error testing user profile:", error);
      return false;
    }
  };

  // Test 2: Check if user has at least one space
  const testUserSpaces = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("spaces")
        .select(`
          id, 
          name, 
          created_by, 
          max_recipes, 
          max_users, 
          is_active, 
          created_at
        `)
        .eq("created_by", user.id);
      
      if (error) throw error;
      setSpaces(data as Space[]);
      return data.length > 0;
    } catch (error) {
      console.error("Error testing user spaces:", error);
      return false;
    }
  };

  // Test 3: Check if user has admin access to their space
  const testSpaceMembership = async () => {
    if (!user || spaces.length === 0) return false;
    
    try {
      const { data, error } = await supabase
        .from("user_spaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("space_id", spaces[0].id);
      
      if (error) throw error;
      setUserSpaces(data as UserSpace[]);
      
      if (data.length === 0) return false;
      // Check if user is admin of at least one space
      return data.some(membership => membership.role === 'admin');
    } catch (error) {
      console.error("Error testing space membership:", error);
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
    
    const results = {
      userProfile: await testUserProfile(),
      userSpaces: await testUserSpaces(),
      spaceMembership: await testSpaceMembership(),
      rlsPolicies: await testRLSPolicies()
    };
    
    setTestResults(results);
    setLoading(false);
  };

  // Function to create a default space for the user
  const createDefaultSpace = async () => {
    if (!user) return;
    
    setCreatingSpace(true);
    try {
      // Call our function to create a space for an existing user
      const { data, error } = await supabase
        .rpc('create_space_for_existing_user', {
          user_id_param: user.id
        });
      
      if (error) throw error;
      
      toast({
        title: "Space created",
        description: "Default space has been created successfully!",
      });
      
      // Re-run the tests to update the UI
      await runAllTests();
    } catch (error: any) {
      console.error("Error creating default space:", error);
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
                  <div className="flex justify-between">
                    <span>User Profile Created:</span>
                    <span className={testResults.userProfile ? "text-green-500" : "text-red-500"}>
                      {testResults.userProfile ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Space Created:</span>
                    <span className={testResults.userSpaces ? "text-green-500" : "text-red-500"}>
                      {testResults.userSpaces ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Role Assigned:</span>
                    <span className={testResults.spaceMembership ? "text-green-500" : "text-red-500"}>
                      {testResults.spaceMembership ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>RLS Policies Working:</span>
                    <span className={testResults.rlsPolicies ? "text-green-500" : "text-red-500"}>
                      {testResults.rlsPolicies ? "✓ Pass" : "✗ Fail"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Button to create default space for existing user */}
              {testResults.userProfile && !testResults.userSpaces && (
                <div className="my-4">
                  <Button 
                    onClick={createDefaultSpace} 
                    disabled={creatingSpace}
                    className="w-full"
                  >
                    {creatingSpace ? "Creating Space..." : "Create Default Space"}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    Your account was created before space functionality was added. 
                    Click the button above to create a default space.
                  </p>
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
