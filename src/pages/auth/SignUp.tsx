
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat } from "lucide-react";
import { logger } from "@/utils/logger";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

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
        setUsernameError(`Username taken. Try: ${suggestions.slice(0, 3).join(', ')}`);
        return false;
      }
      
      setUsernameError("");
      return true;
    } catch (error) {
      logger.error('Error checking username', error, "SignUp");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setUsernameError("");

    logger.debug("Starting signup process", null, "SignUp");

    if (password !== confirmPassword) {
      logger.debug("Passwords don't match", null, "SignUp");
      setErrorMessage("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      logger.debug("Password too short", null, "SignUp");
      setErrorMessage("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    if (username.length < 3) {
      logger.debug("Username too short", null, "SignUp");
      setUsernameError("Username must be at least 3 characters");
      setIsSubmitting(false);
      return;
    }

    logger.debug("Form validation passed, checking username availability", null, "SignUp");

    // Check username availability with detailed error logging
    let isUsernameAvailable = false;
    try {
      logger.debug("Calling RPC function check_username_availability", { username }, "SignUp");
      
      const { data, error } = await (supabase.rpc as any)('check_username_availability', {
        username: username
      });
      
      logger.debug("RPC function response", { data, error: error?.message }, "SignUp");
      
      if (error) {
        logger.error("RPC function error", error, "SignUp");
        setUsernameError(`Username check failed: ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        logger.error("RPC function returned invalid data", data, "SignUp");
        setUsernameError("Username check failed: Invalid response from server");
        setIsSubmitting(false);
        return;
      }
      
      const result = data[0];
      logger.debug("RPC function result", result, "SignUp");
      
      if (!result.is_available) {
        const suggestions = result.suggestions || [];
        setUsernameError(`Username taken. Try: ${suggestions.slice(0, 3).join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      isUsernameAvailable = true;
      logger.debug("Username is available", null, "SignUp");
      
    } catch (err) {
      logger.error("Unexpected error during username check", err, "SignUp");
      setUsernameError(`Username check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsSubmitting(false);
      return;
    }

    if (!isUsernameAvailable) {
      logger.debug("Username not available", null, "SignUp");
      setIsSubmitting(false);
      return;
    }

    logger.debug("Username available, signing up with metadata", null, "SignUp");

    // SignUp with Metadata - The Fix: Pass username directly to Supabase Auth
    const { error } = await signUp(email, password, {
      username: username, // <--- Sent to DB immediately via metadata
    });
    
    logger.debug("signUp() result", { error: error?.message }, "SignUp");
    
    if (error) {
      logger.error("signUp() failed", error, "SignUp");
      setErrorMessage(error.message);
      setIsSubmitting(false);
    } else {
      logger.debug("signUp() succeeded - username saved in metadata", null, "SignUp");
      setSuccess(true);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="flex items-center mb-6">
          <ChefHat className="h-8 w-8 text-sage-500 mr-2" />
          <h1 className="text-2xl font-display font-semibold text-sage-600">Culinova</h1>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Verification email sent!</CardTitle>
            <CardDescription>
              Check your email to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-700 mb-6">
              We've sent a verification link to <span className="font-medium">{email}</span>. Click the link in that email to verify your account.
            </p>
            <p className="text-sm text-slate-500">
              If you don't see the email, check your spam folder.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/sign-in")}
            >
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex items-center mb-6">
        <ChefHat className="h-8 w-8 text-sage-500 mr-2" />
        <h1 className="text-2xl font-display font-semibold text-sage-600">Culinova</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up to start managing your recipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {errorMessage && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {errorMessage}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-sage-500 hover:bg-sage-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-sage-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
