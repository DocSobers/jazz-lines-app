import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/clerk-react';
import { DEMO_PLAYER_PATH } from '../lib/demo-idioms';

const PLAYER_URL = '/app';

interface PlayerCtaProps {
  clerkEnabled: boolean;
  className?: string;
  children: React.ReactNode;
  /** sign-up/sign-in gate full player; browse opens guest demo */
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
        <AuthButton mode="modal" forceRedirectUrl={PLAYER_URL}>
          <button type="button" className={className}>
            {children}
          </button>
        </AuthButton>
      </SignedOut>
    </>
  );
}
