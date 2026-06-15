import { useEffect, useRef } from 'react';
import { renderExampleStaff } from '../lib/notation';
import type { Example } from '../types';

interface StaffCardProps {
  example: Example;
  onClose: () => void;
  onPlay: () => void;
  playing?: boolean;
  hint?: string;
  className?: string;
}

export default function StaffCard({
  example,
  onClose,
  onPlay,
  playing = false,
  hint = 'Treble clef · 4/4 · swung eighths',
  className = '',
}: StaffCardProps) {
  const staffRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = staffRef.current;
    if (!el) return;
    renderExampleStaff(el, example);
  }, [example]);

  return (
    <div className="staff-backdrop" onClick={onClose} role="presentation">
      <div
        className={`staff-card${className ? ` ${className}` : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-title"
      >
        <header className="staff-card__header">
          <div>
            <p className="staff-card__eyebrow">{example.section}</p>
            <h2 id="staff-title">{example.label}</h2>
            <p className="staff-card__hint">{hint}</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="staff-card__scroll">
          <div ref={staffRef} className="staff-card__notation" aria-label="Staff notation" />
        </div>

        <footer className="staff-card__footer">
          <p className="staff-card__footer-hint">
            Uses your current tempo, swing, and instrument.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onPlay}
            disabled={playing}
          >
            {playing ? 'Playing…' : 'Play'}
          </button>
        </footer>
      </div>
    </div>
  );
}
