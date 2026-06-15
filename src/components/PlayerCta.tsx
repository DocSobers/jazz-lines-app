import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { DEMO_PLAYER_PATH } from '../lib/demo-idioms';
import { AUTH_REDIRECT_PROPS, PLAYER_PATH } from '../lib/auth-routes';

const PLAYER_URL = PLAYER_PATH;

interface PlayerCtaProps {
  clerkEnabled: boolean;
  className?: string;
  children: React.ReactNode;
  /** sign-up/sign-in gate full player; browse opens demo for guests, full player when signed in */
  action?: 'signin' | 'signup' | 'browse';
}

export default function PlayerCta({
  clerkEnabled,
  className,
  children,
  action = 'signup',
}: PlayerCtaProps) {
  if (action === 'browse') {
    if (!clerkEnabled) {
      return (
        <Link to={DEMO_PLAYER_PATH} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <>
        <SignedIn>
          <Link to={PLAYER_URL} className={className}>
            {children}
          </Link>
        </SignedIn>
        <SignedOut>
          <Link to={DEMO_PLAYER_PATH} className={className}>
            {children}
          </Link>
        </SignedOut>
      </>
    );
  }

  if (!clerkEnabled) {
    return (
      <Link to={DEMO_PLAYER_PATH} className={className}>
        {children}
      </Link>
    );
  }

  const AuthButton = action === 'signin' ? SignInButton : SignUpButton;

  return (
    <>
      <SignedIn>
        <Link to={PLAYER_URL} className={className}>
          {children}
        </Link>
      </SignedIn>
      <SignedOut>
        <AuthButton mode="modal" {...AUTH_REDIRECT_PROPS}>
          <button type="button" className={className}>
            {children}
          </button>
        </AuthButton>
      </SignedOut>
    </>
  );
}
