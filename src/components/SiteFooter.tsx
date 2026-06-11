import type { ReactNode } from 'react';

export const SITE_COPYRIGHT = '© Drunk or Sobers Enterprise 2026';

interface SiteFooterProps {
  children?: ReactNode;
  /** `app` matches the player page footer inside `.app` */
  variant?: 'site' | 'app';
}

export default function SiteFooter({ children, variant = 'site' }: SiteFooterProps) {
  const className =
    variant === 'app' ? 'footer site-footer' : 'landing__footer site-footer';

  return (
    <footer className={className}>
      {children}
      <p className="site-footer__copy">{SITE_COPYRIGHT}</p>
    </footer>
  );
}
