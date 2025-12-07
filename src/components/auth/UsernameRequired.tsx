import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface UsernameRequiredProps {
  children: React.ReactNode;
}

const UsernameRequired: React.FC<UsernameRequiredProps> = ({ children }) => {
  const { user, needsUsername, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated but needs username, redirect to setup
    if (user && needsUsername && !isLoading) {
      navigate("/username-setup", { replace: true });
    }
  }, [user, needsUsername, isLoading, navigate]);

  // If user is not authenticated or has username, allow access
  if (!user || !needsUsername || isLoading) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
};

export default UsernameRequired;
