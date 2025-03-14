import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// This component handles authentication callbacks from Supabase
// It works with the /auth/v1/callback path for both email and Google OAuth
const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from the URL (this is standard for Supabase auth)
        const code = searchParams.get("code");
        const type = searchParams.get("type");
        
        console.log("Auth callback params:", { code, type });
        
        if (!code) {
          console.error("No authentication code provided");
          toast({
            title: "Authentication failed",
            description: "No authentication code provided. Please try again.",
            variant: "destructive",
          });
          // Redirect to sign-in page after a short delay
          setTimeout(() => navigate("/sign-in"), 1500);
          return;
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error("Auth session exchange error:", error);
          throw error;
        }

        // After successful code exchange, give a small delay to ensure
        // the auth state is properly updated across the application
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the current session to verify it worked
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session established:", !!session);

        if (!session) {
          throw new Error("Failed to establish session");
        }

        toast({
          title: type === "signup" ? "Email verified successfully" : "Authentication successful",
          description: "You are now signed in",
        });
        
        // Redirect to home page after successful auth
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        
        toast({
          title: "Authentication failed",
          description: err.message || "Please try again",
          variant: "destructive",
        });
        
        // Redirect to sign-in page after a short delay
        setTimeout(() => navigate("/sign-in"), 1500);
      } finally {
        // We'll keep isLoading true until we navigate away
        // This prevents UI flickering during the redirection
      }
    };

    handleAuthCallback();
  }, [navigate, toast, searchParams]);

  // Always show loading state in this component as we'll always navigate away
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <p className="text-slate-600 animate-pulse">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;
