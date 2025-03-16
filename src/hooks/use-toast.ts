
// Import directly from sonner since @/components/ui/sonner doesn't export useToast and toast
import { toast } from "sonner";
import { useToast as useToastHook } from "@/components/ui/use-toast";

// Create our own hook that matches the expected signature
export const useToast = () => {
  const { toast: toastHook } = useToastHook();
  return { toast: toastHook };
};

// Re-export toast directly from sonner
export { toast };
