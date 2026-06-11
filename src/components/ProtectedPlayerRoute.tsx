import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import PlayerApp from '../PlayerApp';
import PlayerAuthGate from '../pages/PlayerAuthGate';
import SiteFooter from './SiteFooter';
import SiteNav from './SiteNav';
import '../App.css';
import '../pages/LandingPage.css';

interface ProtectedPlayerRouteProps {
  clerkEnabled: boolean;
}

function PlayerAuthDisabled() {
  return (
    <div className="landing">
      <SiteNav clerkEnabled={false} />
      <main className="auth-gate">
        <h1 className="auth-gate__title">Sign-in required</h1>
        <p className="auth-gate__lede">
          The player requires Clerk authentication. Set{' '}
          <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to enable
          sign-up and sign-in.
        </p>
        <Link to="/" className="btn btn--ghost">
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProtectedPlayerWithClerk() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="landing">
        <SiteNav clerkEnabled />
        <main className="auth-gate">
          <p className="auth-gate__lede">Loading…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!isSignedIn) {
    return <PlayerAuthGate clerkEnabled />;
  }

  return <PlayerApp clerkEnabled />;
}

export default function ProtectedPlayerRoute({
  clerkEnabled,
}: ProtectedPlayerRouteProps) {
  if (!clerkEnabled) {
    return <PlayerAuthDisabled />;
  }

  return <ProtectedPlayerWithClerk />;
}
