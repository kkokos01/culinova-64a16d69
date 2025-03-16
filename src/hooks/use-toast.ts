
// Import the toast API from sonner directly
import { toast as sonnerToast } from "sonner";

// Create a custom hook that doesn't depend on the UI component
export const useToast = () => {
  // Return a simple toast API with a similar interface
  return {
    toast: (props: any) => {
      if (props.variant === "destructive") {
        return sonnerToast.error(props.title, {
          description: props.description,
        });
      }
      return sonnerToast(props.title, {
        description: props.description,
      });
    },
    toasts: [], // Provide empty array for compatibility
    dismiss: () => {} // Provide no-op for compatibility
  };
};

// Re-export toast directly from sonner
export { sonnerToast as toast };
