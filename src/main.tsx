
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add error boundary for debugging
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found");
} else {
  try {
    console.log("Mounting React app");
    
    // Add more detailed error handling
    const root = createRoot(rootElement);
    
    // Wrap render in try-catch for better error reporting
    try {
      console.log("Attempting to render app");
      root.render(<App />);
      console.log("App rendered successfully");
    } catch (renderError) {
      console.error("Error rendering App component:", renderError);
    }
  } catch (error) {
    console.error("Critical error mounting app:", error);
  }
}
