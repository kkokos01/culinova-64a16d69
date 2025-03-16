
// Import the toast API from the UI components
import { toast as shadcnToast, useToast as useUIToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

// Create a custom hook that provides both toast implementations
export const useToast = () => {
  // Get the shadcn toast context
  const shadcnContext = useUIToast();
  
  // Return a combined API that supports both toast systems
  return {
    ...shadcnContext,
    // Add sonner toast methods for compatibility
    sonner: {
      success: (title: string, description?: string) => 
        sonnerToast.success(title, { description }),
      error: (title: string, description?: string) => 
        sonnerToast.error(title, { description }),
      info: (title: string, description?: string) => 
        sonnerToast(title, { description }),
      warning: (title: string, description?: string) => 
        sonnerToast.warning(title, { description }),
    }
  };
};

// Re-export the original toast functions for direct usage
export { shadcnToast as toast, sonnerToast };
