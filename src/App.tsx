import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import BioPage from './pages/BioPage';
import LandingPage from './pages/LandingPage';

const PlayerApp = lazy(() => import('./PlayerApp'));
const ProtectedPlayerRoute = lazy(() => import('./components/ProtectedPlayerRoute'));

interface AppProps {
  clerkEnabled?: boolean;
}

function PlayerRouteFallback() {
  return (
    <div className="landing">
      <main className="auth-gate">
        <p className="auth-gate__lede">Loading player…</p>
      </main>
    </div>
  );
}

export default function App({ clerkEnabled = false }: AppProps) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage clerkEnabled={clerkEnabled} />} />
        <Route path="/about" element={<AboutPage clerkEnabled={clerkEnabled} />} />
        <Route path="/bio" element={<BioPage clerkEnabled={clerkEnabled} />} />
        <Route
          path="/app/demo"
          element={
            <Suspense fallback={<PlayerRouteFallback />}>
              <PlayerApp clerkEnabled={clerkEnabled} demoMode />
            </Suspense>
          }
        />
        <Route
          path="/app"
          element={
            <Suspense fallback={<PlayerRouteFallback />}>
              <ProtectedPlayerRoute clerkEnabled={clerkEnabled} />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
