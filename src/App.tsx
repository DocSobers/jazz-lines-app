import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import BioPage from './pages/BioPage';
import LandingPage from './pages/LandingPage';
import ProtectedPlayerRoute from './components/ProtectedPlayerRoute';
import PlayerApp from './PlayerApp';

interface AppProps {
  clerkEnabled?: boolean;
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
          element={<PlayerApp clerkEnabled={clerkEnabled} demoMode />}
        />
        <Route
          path="/app"
          element={<ProtectedPlayerRoute clerkEnabled={clerkEnabled} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
