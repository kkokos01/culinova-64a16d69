
// Import the original toast hook from the UI component
import { useToast as useToastOriginal } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

// Export the hook with a different name to avoid the recursive call
export const useToast = () => {
  return useToastOriginal();
};

// Re-export toast directly from sonner
export { sonnerToast as toast };
