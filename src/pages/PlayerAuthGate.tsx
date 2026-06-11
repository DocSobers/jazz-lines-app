import { Link } from 'react-router-dom';
import {
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import '../App.css';
import './LandingPage.css';

const PLAYER_URL = '/app';

interface PlayerAuthGateProps {
  clerkEnabled: boolean;
}

export default function PlayerAuthGate({ clerkEnabled }: PlayerAuthGateProps) {
  return (
    <div className="landing">
      <SiteNav clerkEnabled={clerkEnabled} />

      <main className="auth-gate">
        <p className="landing__eyebrow">Members only</p>
        <h1 className="auth-gate__title">Sign in to open the player</h1>
        <p className="auth-gate__lede">
          Create a free account or sign in to browse idioms, chain lines, and hear
          your practice phrases.
        </p>

        <div className="auth-gate__actions">
          <SignUpButton mode="modal" forceRedirectUrl={PLAYER_URL}>
            <button type="button" className="btn btn--primary">
              Sign up
            </button>
          </SignUpButton>
          <SignInButton mode="modal" forceRedirectUrl={PLAYER_URL}>
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
