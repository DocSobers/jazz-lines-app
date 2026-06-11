import { Link, useLocation } from 'react-router-dom';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import '../pages/LandingPage.css';

interface SiteNavProps {
  clerkEnabled: boolean;
}

export default function SiteNav({ clerkEnabled }: SiteNavProps) {
  const { pathname } = useLocation();

  return (
    <header className="landing__nav">
      <Link to="/" className="landing__nav-brand">
        <span className="landing__nav-title">Jazz Lines</span>
        <span className="landing__nav-tag">ii–V–I</span>
      </Link>

      <nav className="landing__nav-links" aria-label="Site">
        <Link
          to="/"
          className={`landing__nav-link ${pathname === '/' ? 'landing__nav-link--active' : ''}`}
        >
          Home
        </Link>
        <Link
          to="/about"
          className={`landing__nav-link ${pathname === '/about' ? 'landing__nav-link--active' : ''}`}
        >
          About
        </Link>
        <Link
          to="/bio"
          className={`landing__nav-link ${pathname === '/bio' ? 'landing__nav-link--active' : ''}`}
        >
          Bio
        </Link>
      </nav>

      <div className="landing__nav-actions">
        {clerkEnabled ? (
          <>
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="btn btn--ghost">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="btn btn--primary">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </>
        ) : null}
        {clerkEnabled ? (
          <SignedIn>
            <Link to="/app" className="btn btn--primary">
              Open player
            </Link>
          </SignedIn>
        ) : null}
      </div>
    </header>
  );
}
