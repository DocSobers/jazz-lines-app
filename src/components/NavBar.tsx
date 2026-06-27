import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import { JAZZ_IDIOMS } from '../data/jazz-idioms';
import type { ExampleEdits } from '../lib/example-edits';
import { EXAMPLE_CHAINS, type ExampleChainId } from '../lib/example-chains';
import { exportEditsToXlsx } from '../lib/export-xlsx';
import { AUTH_REDIRECT_PROPS } from '../lib/auth-routes';
import ThemePicker from './ThemePicker';

interface NavBarProps {
  edits: ExampleEdits;
  clerkEnabled: boolean;
  isAdmin: boolean;
  exampleChainId?: ExampleChainId | '';
  onExampleChainChange?: (id: ExampleChainId) => void;
}

export default function NavBar({
  edits,
  clerkEnabled,
  isAdmin,
  exampleChainId = '',
  onExampleChainChange,
}: NavBarProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const editCount = Object.keys(edits).length;
  const showExamples = Boolean(onExampleChainChange);

  const handleExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      await exportEditsToXlsx(JAZZ_IDIOMS, edits);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <nav className={`navbar${showExamples ? ' navbar--with-examples' : ''}`}>
      <div className="navbar__row navbar__row--primary">
        <div className="navbar__brand">
          <Link to="/" className="navbar__brand-link">
            <span className="navbar__title">Jazz Lines</span>
            <span className="navbar__tag">ii–V–I</span>
          </Link>
        </div>

        <div className="navbar__actions">
          <ThemePicker />
          <Link to="/about" className="btn btn--ghost navbar__player">
            About
          </Link>
          <Link to="/bio" className="btn btn--ghost navbar__player">
            Bio
          </Link>
          <Link to="/app" className="btn btn--ghost navbar__player">
            Player
          </Link>
          {exportError && <span className="navbar__error">{exportError}</span>}

          {isAdmin && (
            <button
              type="button"
              className="btn btn--ghost navbar__export"
              onClick={() => void handleExport()}
              disabled={exporting || editCount === 0}
              title={
                editCount === 0
                  ? 'Edit idioms first, then export'
                  : `Export ${editCount} edited idiom(s) to jazz_idoms.xlsx`
              }
            >
              {exporting ? 'Exporting…' : `Export XLSX (${editCount})`}
            </button>
          )}

          {clerkEnabled ? (
            <>
              <SignedOut>
                <SignInButton mode="modal" {...AUTH_REDIRECT_PROPS}>
                  <button type="button" className="btn btn--ghost">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" {...AUTH_REDIRECT_PROPS}>
                  <button type="button" className="btn btn--primary">
                    Sign up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <span className="navbar__hint">Set VITE_CLERK_PUBLISHABLE_KEY to enable auth</span>
          )}
        </div>
      </div>

      {showExamples && (
        <div className="navbar__row navbar__row--secondary">
          <label className="navbar__example">
            <span className="navbar__example-label">Examples:</span>
            <select
              className="navbar__example-select"
              value={exampleChainId}
              onChange={(event) =>
                onExampleChainChange?.(event.target.value as ExampleChainId)
              }
              aria-label="Load example line"
            >
              <option value="">Choose…</option>
              {EXAMPLE_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.label} — {chain.description}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </nav>
  );
}
