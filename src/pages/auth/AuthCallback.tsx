import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

// This component handles authentication callbacks from Supabase
// It works with the /auth/v1/callback path for both email and Google OAuth
const AuthCallback = () => {
  logger.debug("AuthCallback component MOUNTING", null, "AuthCallback");
  
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
        
        logger.debug("Auth callback params", { code, type, provider }, "AuthCallback");
        
        if (!code) {
          logger.debug("No authentication code in URL, checking for active session", null, "AuthCallback");
          
          // For OAuth flows, tokens may be in hash fragment and need time to process
          // Add retry logic to handle this timing issue
          let session = null;
          let retries = 0;
          const maxRetries = 5;
          
          while (!session && retries < maxRetries) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            session = currentSession;
            
            if (session) {
              break;
            }
            
            logger.debug(`No session yet, retrying... (${retries + 1}/${maxRetries})`, null, "AuthCallback");
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            retries++;
          }
          
          logger.debug("Session check after retries", { session: !!session, attempts: retries }, "AuthCallback");
          
          if (session) {
            logger.debug("Active session found after OAuth processing", null, "AuthCallback");
            toast({
              title: "Authentication successful",
              description: "You are now signed in",
            });
            
            // Redirect to home page
            navigate("/", { replace: true });
            return;
          }
          
          // No code and no session after retries means authentication failed
          console.error("No authentication code provided and no active session after retries");
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
        logger.debug("Exchanging code for session", null, "AuthCallback");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          logger.error("Auth session exchange error", error, "AuthCallback");
          throw error;
        }

        logger.debug("Code exchange successful, waiting for session setup", null, "AuthCallback");
        
        // Database triggers handle auth state atomically - no delay needed

        // Get the current session to verify it worked
        const { data: { session } } = await supabase.auth.getSession();
        logger.debug("Session established", { session: !!session }, "AuthCallback");

        if (!session) {
          logger.error("Failed to establish session after successful code exchange", null, "AuthCallback");
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
