
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSidebar from "@/components/auth/ProfileSidebar";
import ProfileSettings from "@/components/auth/ProfileSettings";
import SpacesList from "@/components/auth/SpacesList";
import { useUserData } from "@/hooks/useUserData";

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const { 
    profileData, 
    setProfileData, 
    spaces,
    memberships,
    fetchSpaces
  } = useUserData(user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-display font-semibold text-slate-800 mb-8">Your Profile</h1>

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
              </TabsList>
              
              <TabsContent value="profile">
                <ProfileSettings 
                  userId={user?.id}
                  profileData={profileData}
                  setProfileData={setProfileData}
                />
              </TabsContent>
              
              <TabsContent value="spaces">
                <SpacesList
                  userId={user?.id || ''}
                  spaces={spaces}
                  memberships={memberships}
                  refreshSpaces={fetchSpaces}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
