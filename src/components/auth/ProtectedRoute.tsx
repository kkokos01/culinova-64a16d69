
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean; // Add this prop
};

// Define your admin emails here
// TODO: Replace with proper roles system when available
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "kevin.kokoszka@gmail.com")
  .split(",")
  .map(email => email.trim()); 

const ProtectedRoute = ({ 
  children, 
  redirectTo = "/sign-in",
  requireAdmin = false 
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-500 border-t-transparent"></div>
      </div>
    );
  }

  // 1. Check if logged in
  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  // 2. Check if admin required
  if (requireAdmin && user.email && !ADMIN_EMAILS.includes(user.email)) {
    // If user is logged in but not an admin, send them to home/collections
    return <Navigate to="/" />; 
  }

  return <>{children}</>;
};

export default ProtectedRoute;
