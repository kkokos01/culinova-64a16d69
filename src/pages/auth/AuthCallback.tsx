
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the 'code' query parameter from the URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      
      if (!code) {
        setError("No code provided");
        setIsLoading(false);
        return;
      }

      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          throw error;
        }

        toast({
          title: "Authentication successful",
          description: "You are now signed in",
        });
        
        // Redirect to home page after successful auth
        navigate("/");
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Authentication failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-500 border-t-transparent"></div>
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
