import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import { AUTH_REDIRECT_PROPS, PLAYER_PATH } from '../lib/auth-routes';
import '../App.css';
import './LandingPage.css';

interface PlayerAuthGateProps {
  clerkEnabled: boolean;
}

export default function PlayerAuthGate({ clerkEnabled }: PlayerAuthGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate(PLAYER_PATH, { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="landing">
      <SiteNav clerkEnabled={clerkEnabled} />

      <main className="auth-gate">
        <p className="landing__eyebrow">Members only</p>
        <h1 className="auth-gate__title">Create your free account</h1>
        <p className="auth-gate__lede">
          Sign up once — you&apos;ll go straight into the player. Already have an
          account? Use Sign in below.
        </p>

        <div className="auth-gate__actions">
          <SignUpButton mode="modal" {...AUTH_REDIRECT_PROPS}>
            <button type="button" className="btn btn--primary">
              Sign up
            </button>
          </SignUpButton>
          <SignInButton mode="modal" {...AUTH_REDIRECT_PROPS}>
            <button type="button" className="btn btn--ghost">
              Sign in
            </button>
          </SignInButton>
        </div>

        <Link to="/" className="auth-gate__back">
          ← Back to home
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
