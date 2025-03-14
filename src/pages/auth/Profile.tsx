
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  display_name: string;
  avatar_url: string;
  default_unit_system: 'metric' | 'imperial';
  theme_preference: 'light' | 'dark' | 'system';
  default_servings: number;
  show_nutritional_info: boolean;
}

interface Space {
  id: string;
  name: string;
  max_recipes: number;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

interface SpaceMembership {
  id: string;
  space_id: string;
  role: 'admin' | 'editor' | 'viewer';
  space?: Space;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [memberships, setMemberships] = useState<SpaceMembership[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: "",
    avatar_url: "",
    default_unit_system: "metric",
    theme_preference: "light",
    default_servings: 2,
    show_nutritional_info: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSpaces();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          display_name: data.display_name || "",
          avatar_url: data.avatar_url || "",
          default_unit_system: data.default_unit_system || "metric",
          theme_preference: data.theme_preference || "light",
          default_servings: data.default_servings || 2,
          show_nutritional_info: data.show_nutritional_info !== undefined ? data.show_nutritional_info : true
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpaces = async () => {
    try {
      // Fetch spaces the user is a member of
      const { data: membershipData, error: membershipError } = await supabase
        .from("user_spaces")
        .select(`
          id,
          space_id,
          role,
          space:spaces(
            id,
            name,
            max_recipes,
            max_users,
            is_active,
            created_at
          )
        `)
        .eq("user_id", user?.id)
        .eq("is_active", true);

      if (membershipError) throw membershipError;

      if (membershipData) {
        const processedMemberships = membershipData.map(item => ({
          id: item.id,
          space_id: item.space_id,
          role: item.role as 'admin' | 'editor' | 'viewer',
          space: item.space as Space
        }));
        
        setMemberships(processedMemberships);
        
        // Extract just the spaces
        const spaces = processedMemberships
          .map(membership => membership.space)
          .filter(Boolean) as Space[];
        
        setSpaces(spaces);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
      toast({
        title: "Error fetching spaces",
        description: "Could not load your spaces. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user?.id,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          default_unit_system: profileData.default_unit_system,
          theme_preference: profileData.theme_preference,
          default_servings: profileData.default_servings,
          show_nutritional_info: profileData.show_nutritional_info,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSpace = async () => {
    try {
      const spaceName = prompt("Enter a name for your new space:");
      if (!spaceName) return;

      setIsLoading(true);
      
      // Insert the new space
      const { data: spaceData, error: spaceError } = await supabase
        .from("spaces")
        .insert({
          name: spaceName,
          created_by: user?.id,
        })
        .select()
        .single();

      if (spaceError) throw spaceError;

      // No need to manually create user_spaces entry due to RLS
      // Refresh the spaces list
      await fetchSpaces();
      
      toast({
        title: "Space created",
        description: `"${spaceName}" has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast({
        title: "Error creating space",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-display font-semibold text-slate-800 mb-8">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profileData.avatar_url} alt={profileData.display_name || user?.email} />
                  <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                </Avatar>
                <CardTitle>{profileData.display_name || "Set your name"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Manage your account information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateProfile();
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={profileData.display_name}
                          onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                          placeholder="Your display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                        <Input
                          id="avatarUrl"
                          value={profileData.avatar_url}
                          onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                          placeholder="https://example.com/your-avatar.jpg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultUnitSystem">Default Unit System</Label>
                        <Select 
                          value={profileData.default_unit_system} 
                          onValueChange={(value: any) => setProfileData({...profileData, default_unit_system: value})}
                        >
                          <SelectTrigger id="defaultUnitSystem">
                            <SelectValue placeholder="Select unit system" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="metric">Metric (g, ml, cm)</SelectItem>
                            <SelectItem value="imperial">Imperial (oz, cups, inch)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="themePreference">Theme Preference</Label>
                        <Select 
                          value={profileData.theme_preference} 
                          onValueChange={(value: any) => setProfileData({...profileData, theme_preference: value})}
                        >
                          <SelectTrigger id="themePreference">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultServings">Default Servings</Label>
                        <Input
                          id="defaultServings"
                          type="number"
                          min="1"
                          max="20"
                          value={profileData.default_servings}
                          onChange={(e) => setProfileData({...profileData, default_servings: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showNutritionalInfo"
                          checked={profileData.show_nutritional_info}
                          onCheckedChange={(checked) => 
                            setProfileData({...profileData, show_nutritional_info: checked})
                          }
                        />
                        <Label htmlFor="showNutritionalInfo">Show Nutritional Information</Label>
                      </div>

                      <Button
                        type="submit"
                        className="bg-sage-500 hover:bg-sage-600"
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="spaces">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Your Spaces</CardTitle>
                      <CardDescription>
                        Manage your recipe collections
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={createNewSpace} 
                      disabled={isLoading}
                    >
                      Create Space
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {spaces.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        You don't have any spaces yet. Create one to get started!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {spaces.map((space) => {
                          const membership = memberships.find(m => m.space_id === space.id);
                          return (
                            <Card key={space.id}>
                              <CardHeader>
                                <div className="flex justify-between items-center">
                                  <CardTitle>{space.name}</CardTitle>
                                  <span className="text-sm px-2 py-1 bg-slate-100 rounded-md capitalize">
                                    {membership?.role || 'member'}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm text-slate-500">
                                  <p>Members: {space.max_users === 0 ? "Unlimited" : space.max_users}</p>
                                  <p>Recipes: {space.max_recipes === 0 ? "Unlimited" : space.max_recipes}</p>
                                  <p>Created: {new Date(space.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-4 flex space-x-2">
                                  <Button size="sm" variant="outline">View Recipes</Button>
                                  {membership?.role === 'admin' && (
                                    <Button size="sm" variant="outline">Manage</Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
