
import { useToast as useToastShadcn, toast as toastShadcn } from "@/components/ui/sonner";

// Re-export the hook and toast function so that it can be consistently imported
export const useToast = useToastShadcn;
export const toast = toastShadcn;
