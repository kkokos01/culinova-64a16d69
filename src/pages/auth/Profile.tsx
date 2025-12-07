
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileSettings from "@/components/auth/ProfileSettings";
import SpacesList from "@/components/auth/SpacesList";
import PantryManager from "@/components/pantry/PantryManager";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { useUserData } from "@/hooks/useUserData";
import { useSpace } from "@/context/SpaceContext";
import { InvitationService } from "@/services/supabase/invitationService";
import { LogOut, Bell } from "lucide-react";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { currentSpace } = useSpace();
  const [activeTab, setActiveTab] = useState("profile");
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  
  // Set active tab from URL parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pantry' || tabParam === 'spaces' || tabParam === 'profile' || tabParam === 'notifications') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch pending invitations count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const count = await InvitationService.getPendingInvitationsCount();
        setPendingInvitationsCount(count);
      } catch (error) {
        console.error('Error fetching pending invitations count:', error);
      }
    };

    fetchPendingCount();
    
    // Set up periodic refresh for notifications
    const interval = setInterval(fetchPendingCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const { 
    profileData, 
    setProfileData, 
    spaces,
    memberships,
    fetchSpaces,
    isLoading
  } = useUserData(user?.id);

  const getInitials = () => {
    if (profileData.display_name) {
      return profileData.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* Profile Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileData.avatar_url} alt={profileData.display_name || user?.email} />
              <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-display font-semibold text-slate-800 mb-2">
                {profileData.display_name || "Your Profile"}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {currentSpace && (
                <div className="bg-white px-4 py-2 rounded-md shadow-sm border">
                  <span className="text-sm text-slate-500">Current Space:</span>
                  <span className="ml-2 font-medium">{currentSpace.name}</span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
                <TabsTrigger value="pantry">My Pantry</TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                  {pendingInvitationsCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5">
                      {pendingInvitationsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
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
              
              <TabsContent value="notifications">
                <NotificationsList 
                  onInvitationAction={() => {
                    // Refresh pending count when invitations are acted upon
                    InvitationService.getPendingInvitationsCount().then(setPendingInvitationsCount);
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
