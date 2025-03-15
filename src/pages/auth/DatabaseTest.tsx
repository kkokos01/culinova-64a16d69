
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useSpace } from "@/context/SpaceContext";
import DatabaseTester from "@/components/auth/DatabaseTester";
import UnitsTester from "@/components/auth/UnitsTester";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const DatabaseTest = () => {
  const { user } = useAuth();
  const { currentSpace, spaces } = useSpace();

  // Check if user has a default space
  const hasDefaultSpace = spaces.some(space => space.is_default);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-semibold text-slate-800">Database Configuration Tester</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          {user && spaces.length === 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any spaces yet. Some tests require an active space.
              </AlertDescription>
            </Alert>
          )}
          
          {user && spaces.length > 0 && !hasDefaultSpace && (
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have spaces but none is marked as default. The first created space will be used as default.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="database">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="database">Database & Authentication</TabsTrigger>
              <TabsTrigger value="units">Units System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="database">
              <DatabaseTester />
            </TabsContent>
            
            <TabsContent value="units">
              <UnitsTester />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;
