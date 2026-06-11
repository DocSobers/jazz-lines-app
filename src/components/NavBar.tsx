import { useState } from 'react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import { JAZZ_IDIOMS } from '../data/jazz-idioms';
import type { ExampleEdits } from '../lib/example-edits';
import { exportEditsToXlsx } from '../lib/export-xlsx';

interface NavBarProps {
  edits: ExampleEdits;
  clerkEnabled: boolean;
  isAdmin: boolean;
}

export default function NavBar({ edits, clerkEnabled, isAdmin }: NavBarProps) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const editCount = Object.keys(edits).length;

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
    <nav className="navbar">
      <div className="navbar__brand">
        <span className="navbar__title">Jazz Lines</span>
        <span className="navbar__tag">ii–V–I</span>
      </div>

      <div className="navbar__actions">
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
        ) : (
          <span className="navbar__hint">Set VITE_CLERK_PUBLISHABLE_KEY to enable auth</span>
        )}
      </div>
    </nav>
  );
}
