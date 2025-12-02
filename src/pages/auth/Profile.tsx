
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSidebar from "@/components/auth/ProfileSidebar";
import ProfileSettings from "@/components/auth/ProfileSettings";
import SpacesList from "@/components/auth/SpacesList";
import PantryManager from "@/components/pantry/PantryManager";
import { useUserData } from "@/hooks/useUserData";
import { useSpace } from "@/context/SpaceContext";

const Profile = () => {
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const [activeTab, setActiveTab] = useState("profile");
  
  const { 
    profileData, 
    setProfileData, 
    spaces,
    memberships,
    fetchSpaces,
    isLoading
  } = useUserData(user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-semibold text-slate-800">Your Profile</h1>
          {currentSpace && (
            <div className="bg-white px-4 py-2 rounded-md shadow-sm border">
              <span className="text-sm text-slate-500">Current Space:</span>
              <span className="ml-2 font-medium">{currentSpace.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <ProfileSidebar 
              displayName={profileData.display_name} 
              avatarUrl={profileData.avatar_url}
              email={user?.email}
            />
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
                <TabsTrigger value="pantry">My Pantry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-pulse text-slate-500">Loading profile data...</div>
                  </div>
                ) : (
                  <ProfileSettings 
                    userId={user?.id}
                    profileData={profileData}
                    setProfileData={setProfileData}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="spaces">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-pulse text-slate-500">Loading spaces...</div>
                  </div>
                ) : (
                  <SpacesList
                    userId={user?.id || ''}
                    spaces={spaces}
                    memberships={memberships}
                    refreshSpaces={fetchSpaces}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="pantry">
                <PantryManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
