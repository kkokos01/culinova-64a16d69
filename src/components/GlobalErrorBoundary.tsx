import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { 
  children: ReactNode 
}

interface State { 
  hasError: boolean; 
  error: Error | null 
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Send to Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then(Sentry => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }).catch(() => {
        // Silently fail if Sentry is not available
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-600 max-w-md mb-6">
            We encountered an unexpected error. Please try reloading the page.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()}>Reload Application</Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Go Home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
