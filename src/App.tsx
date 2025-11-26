
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SpaceProvider } from "@/context/SpaceContext";
import { RecipeProvider } from "@/context/recipe/RecipeContext";
import { ToastProvider } from "@/components/ui/use-toast";
import Index from "./pages/Index";
import Collections from "./pages/Collections";
import NotFound from "./pages/NotFound";
import Recipes from "./pages/Recipes";
import SupabaseRecipes from "./pages/SupabaseRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeCreate from "./pages/RecipeCreate";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import UpdatePassword from "./pages/auth/UpdatePassword";
import SupabaseHealth from "./pages/SupabaseHealth";

// Temporarily simplified version for debugging
const queryClient = new QueryClient();

function App() {
  console.log("App component rendering");
  
  return (
    <div className="app-root">
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <div>
            <AuthProvider>
              <SpaceProvider>
                <RecipeProvider>
                  <TooltipProvider>
                    <div className="app-container">
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/collections" element={<Collections />} />
                          <Route path="/recipes" element={<Recipes />} />
                          <Route path="/supabase-recipes" element={<SupabaseRecipes />} />
                          <Route path="/create" element={<RecipeCreate />} />
                          <Route path="/recipes/create" element={<RecipeCreate />} />
                          <Route path="/recipes/:id" element={<RecipeDetail />} />
                          <Route path="/sign-in" element={<SignIn />} />
                          <Route path="/sign-up" element={<SignUp />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/update-password" element={<UpdatePassword />} />
                          <Route path="/auth/v1/callback" element={<AuthCallback />} />
                          <Route path="/supabase-health" element={<SupabaseHealth />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </div>
                  </TooltipProvider>
                </RecipeProvider>
              </SpaceProvider>
            </AuthProvider>
          </div>
        </ToastProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
