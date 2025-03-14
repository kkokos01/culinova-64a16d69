
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

const ProtectedRoute = ({ 
  children, 
  redirectTo = "/sign-in" 
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sage-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
