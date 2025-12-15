
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
import PublicCollections from "./pages/PublicCollections";
import PublicRecipes from "./pages/PublicRecipes";
import { Explore } from "./pages/Explore";
import NotFound from "./pages/NotFound";
import SupabaseRecipes from "./pages/SupabaseRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import CookMode from "./pages/CookMode";
import RecipeCreate from "./pages/RecipeCreate";
import ShoppingList from "./pages/ShoppingList";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import UpdatePassword from "./pages/auth/UpdatePassword";
import Profile from "./pages/auth/Profile";
import UsernameSetup from "./pages/auth/UsernameSetup";
import UsernameRequired from "./components/auth/UsernameRequired";
import SupabaseHealth from "./pages/SupabaseHealth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DatabaseTester from "./components/auth/DatabaseTester";
import RecipeReview from "./pages/admin/RecipeReview";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RecipeImport from "./pages/RecipeImport";

// Configure React Query to prevent unnecessary refetches on window focus
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent refetch on window focus
      refetchOnMount: true, // Allow refetch when navigating to pages
      refetchOnReconnect: true, // Allow refetch on reconnection
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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
                          <Route path="/collections" element={
                            <UsernameRequired>
                              <Collections />
                            </UsernameRequired>
                          } />
                          <Route path="/publiccollections" element={
                            <UsernameRequired>
                              <PublicCollections />
                            </UsernameRequired>
                          } />
                          <Route path="/public-recipes" element={
                            <UsernameRequired>
                              <PublicRecipes />
                            </UsernameRequired>
                          } />
                          <Route path="/admin/review" element={
                            <UsernameRequired>
                              <RecipeReview />
                            </UsernameRequired>
                          } />
                          <Route path="/admin/dashboard" element={
                            <UsernameRequired>
                              <AdminDashboard />
                            </UsernameRequired>
                          } />
                          <Route path="/explore" element={
                            <UsernameRequired>
                              <Explore />
                            </UsernameRequired>
                          } />
                          <Route path="/supabase-recipes" element={<SupabaseRecipes />} />
                          <Route path="/create" element={
                            <UsernameRequired>
                              <RecipeCreate />
                            </UsernameRequired>
                          } />
                          <Route path="/recipes/create" element={
                            <UsernameRequired>
                              <RecipeCreate />
                            </UsernameRequired>
                          } />
                          <Route path="/recipes/:id" element={
                            <UsernameRequired>
                              <RecipeDetail />
                            </UsernameRequired>
                          } />
                          <Route path="/recipes/:id/cook" element={
                            <UsernameRequired>
                              <CookMode />
                            </UsernameRequired>
                          } />
                          <Route path="/shopping-list" element={
                            <UsernameRequired>
                              <ShoppingList />
                            </UsernameRequired>
                          } />
                          <Route path="/sign-in" element={<SignIn />} />
                          <Route path="/sign-up" element={<SignUp />} />
                          <Route path="/username-setup" element={<UsernameSetup />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/update-password" element={<UpdatePassword />} />
                          <Route path="/profile" element={
                            <UsernameRequired>
                              <Profile />
                            </UsernameRequired>
                          } />
                          <Route path="/admin/diagnostics" element={
                            <ProtectedRoute requireAdmin={true}>
                              <DatabaseTester />
                            </ProtectedRoute>
                          } />
                          <Route path="/auth/v1/callback" element={<AuthCallback />} />
                          <Route path="/supabase-health" element={<SupabaseHealth />} />
                          <Route path="/import" element={
                            <ProtectedRoute>
                              <UsernameRequired>
                                <RecipeImport />
                              </UsernameRequired>
                            </ProtectedRoute>
                          } />
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
