import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App.tsx';
import { PLAYER_PATH } from './lib/auth-routes';
import { initTheme } from './lib/theme-prefs';

initTheme();

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkKey ? (
      <ClerkProvider
        publishableKey={clerkKey}
        afterSignOutUrl="/"
        signUpForceRedirectUrl={PLAYER_PATH}
        signInForceRedirectUrl={PLAYER_PATH}
        signUpFallbackRedirectUrl={PLAYER_PATH}
        signInFallbackRedirectUrl={PLAYER_PATH}
      >
        <App clerkEnabled />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>
);
