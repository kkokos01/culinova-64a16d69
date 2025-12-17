
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css?v=20241216';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Initialize Sentry for production monitoring
// TODO: Fix Sentry import issue
// if (import.meta.env.PROD) {
//   import('@sentry/react').then((Sentry)=>{
//     if (import.meta.env.VITE_SENTRY_DSN) {
//       Sentry.init({
//         dsn: import.meta.env.VITE_SENTRY_DSN,
//         environment: import.meta.env.MODE,
//       });
//     }
//   });
// }

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
}
