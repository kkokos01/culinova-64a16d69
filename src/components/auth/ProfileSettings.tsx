
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define schema for profile data validation
const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  avatar_url: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  default_unit_system: z.enum(["metric", "imperial"]),
  theme_preference: z.enum(["light", "dark", "system"]),
  default_servings: z.number().int().min(1).max(20),
  show_nutritional_info: z.boolean(),
});

export type ProfileData = z.infer<typeof profileSchema>;

type ProfileSettingsProps = {
  userId: string | undefined;
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
};

const ProfileSettings = ({ userId, profileData, setProfileData }: ProfileSettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize react-hook-form with zod validation
  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileData,
    values: profileData,
  });

  const updateProfile = async (values: ProfileData) => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: userId,
          display_name: values.display_name,
          avatar_url: values.avatar_url,
          default_unit_system: values.default_unit_system,
          theme_preference: values.theme_preference,
          default_servings: values.default_servings,
          show_nutritional_info: values.show_nutritional_info,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update the state with the new values
      setProfileData(values);

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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(updateProfile)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-avatar.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to an image that will be used as your profile picture
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_unit_system"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Unit System</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="metric">Metric (g, ml, cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (oz, cups, inch)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which measurement system you prefer for recipes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme_preference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme Preference</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how the application should appear
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_servings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Servings</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Default number of servings for new recipes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_nutritional_info"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Nutritional Information</FormLabel>
                    <FormDescription>
                      Display nutritional information on recipes
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
