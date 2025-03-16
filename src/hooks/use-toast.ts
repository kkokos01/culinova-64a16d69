
// Import directly from component
import { useToast as useToastHook } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

// Export the hook
export const useToast = () => {
  return useToastHook();
};

// Re-export toast directly from sonner
export { sonnerToast as toast };
