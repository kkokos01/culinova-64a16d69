import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat } from "lucide-react";

const UsernameSetup = () => {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or already has username
  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }

    checkExistingUsername();
  }, [user, navigate]);

  const checkExistingUsername = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();

      if (profile?.display_name) {
        navigate("/collections");
      }
    } catch (error) {
      console.error('Error checking username:', error);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      return false;
    }

    try {
      const { data, error } = await (supabase.rpc as any)('check_username_availability', {
        username: username
      });
      
      if (error) throw error;
      
      if (!data[0]?.is_available) {
        const suggestions = data[0]?.suggestions || [];
        setSuggestions(suggestions.slice(0, 3));
        setUsernameError(`Username taken. Try: ${suggestions.slice(0, 3).join(', ')}`);
        return false;
      }
      
      setUsernameError("");
      setSuggestions([]);
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUsernameError("");

    if (!username || username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      setIsSubmitting(false);
      return;
    }

    const isUsernameAvailable = await checkUsernameAvailability(username);
    if (!isUsernameAvailable) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await (supabase.rpc as any)('create_user_profile_with_username', {
        user_id_param: user?.id,
        username_param: username
      });
      
      if (error) {
        setUsernameError("Failed to create username. Please try again.");
        console.error('Error creating profile:', error);
      } else {
        navigate("/collections");
      }
    } catch (error) {
      setUsernameError("Something went wrong. Please try again.");
      console.error('Error:', error);
    }

    setIsSubmitting(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameError("");
    setSuggestions([]);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex items-center mb-6">
        <ChefHat className="h-8 w-8 text-sage-500 mr-2" />
        <h1 className="text-2xl font-display font-semibold text-sage-600">Culinova</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Choose your username</CardTitle>
          <CardDescription>
            Your username will be used across the app to identify you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onBlur={() => username && checkUsernameAvailability(username)}
                required
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Available alternatives:</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-sage-500 hover:bg-sage-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsernameSetup;
