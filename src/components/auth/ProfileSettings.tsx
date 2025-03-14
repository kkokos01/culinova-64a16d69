
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export interface ProfileData {
  display_name: string;
  avatar_url: string;
  default_unit_system: 'metric' | 'imperial';
  theme_preference: 'light' | 'dark' | 'system';
  default_servings: number;
  show_nutritional_info: boolean;
}

type ProfileSettingsProps = {
  userId: string | undefined;
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
};

const ProfileSettings = ({ userId, profileData, setProfileData }: ProfileSettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
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

  return (
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
              onValueChange={(value: 'metric' | 'imperial') => setProfileData({...profileData, default_unit_system: value})}
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
              onValueChange={(value: 'light' | 'dark' | 'system') => setProfileData({...profileData, theme_preference: value})}
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
  );
};

export default ProfileSettings;
