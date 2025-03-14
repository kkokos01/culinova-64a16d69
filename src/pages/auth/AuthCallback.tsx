
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
        const provider = searchParams.get("provider");
        
        console.log("Auth callback params:", { code, type, provider });
        
        if (!code) {
          console.log("No authentication code in URL, checking for active session");
          
          // Introduce a small delay to ensure auth state is properly initialized
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // If there's no code, check if we still have a valid session
          // This can happen with some OAuth providers where the flow is different
          const { data: { session } } = await supabase.auth.getSession();
          console.log("Session check without code:", !!session);
          
          if (session) {
            console.log("Active session found despite no code parameter");
            // We have a session, so the auth likely succeeded through another flow
            toast({
              title: "Authentication successful",
              description: "You are now signed in",
            });
            
            // Redirect to home page
            navigate("/", { replace: true });
            return;
          }
          
          // No code and no session means authentication failed
          console.error("No authentication code provided and no active session");
          toast({
            title: "Authentication failed",
            description: "Please try signing in again",
            variant: "destructive",
          });
          
          // Redirect to sign-in page after a short delay
          setTimeout(() => navigate("/sign-in", { replace: true }), 1500);
          return;
        }

        // Exchange the code for a session
        console.log("Exchanging code for session...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error("Auth session exchange error:", error);
          throw error;
        }

        console.log("Code exchange successful, waiting for session setup...");
        
        // After successful code exchange, give a longer delay to ensure
        // the auth state is properly updated across the application
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get the current session to verify it worked
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session established:", !!session);

        if (!session) {
          console.error("Failed to establish session after successful code exchange");
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
        setTimeout(() => navigate("/sign-in", { replace: true }), 1500);
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
