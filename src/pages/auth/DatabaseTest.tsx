
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import DatabaseTester from "@/components/auth/DatabaseTester";
import UnitsTester from "@/components/auth/UnitsTester";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DatabaseTest = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-semibold text-slate-800">Database Configuration Tester</h1>
        </div>

        <div className="max-w-3xl mx-auto">
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
