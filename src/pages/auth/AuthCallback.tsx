
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// This component handles authentication callbacks from Supabase
const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
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
          throw new Error("No authentication code provided");
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          throw error;
        }

        // Get the current session to verify it worked
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session established:", !!session);

        toast({
          title: type === "signup" ? "Email verified successfully" : "Authentication successful",
          description: "You are now signed in",
        });
        
        // Redirect to home page after successful auth
        navigate("/");
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        toast({
          title: "Authentication failed",
          description: err.message || "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-500 border-t-transparent"></div>
        <p className="ml-2 text-slate-700">Verifying your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-slate-700 mb-6">{error}</p>
        <button 
          className="px-4 py-2 bg-sage-500 text-white rounded hover:bg-sage-600"
          onClick={() => navigate("/sign-in")}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  // Default case: redirect to home if everything went well
  return <Navigate to="/" />;
};

export default AuthCallback;
