
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SpaceProvider } from "@/context/SpaceContext";
import { RecipeProvider } from "@/context/recipe/RecipeContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Temporarily simplified version for debugging
const queryClient = new QueryClient();

function App() {
  console.log("App component rendering");
  
  return (
    <div className="app-root">
      <QueryClientProvider client={queryClient}>
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
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </div>
                </TooltipProvider>
              </RecipeProvider>
            </SpaceProvider>
          </AuthProvider>
        </div>
      </QueryClientProvider>
    </div>
  );
}

export default App;
