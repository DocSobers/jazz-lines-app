import { useCallback, useEffect, useRef, useState } from 'react';
import { renderExampleStaff } from '../lib/notation';
import { buildSchedule, playNotes, stopPlayback } from '../lib/playback';
import { playheadX, type StaffPlayheadLayout } from '../lib/staff-playhead';
import type { Example, Note } from '../types';

interface StaffCardProps {
  example: Example;
  playbackNotes: Note[];
  bpm: number;
  swing: number;
  loop?: boolean;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  hint?: string;
  className?: string;
}

export default function StaffCard({
  example,
  playbackNotes,
  bpm,
  swing,
  loop = false,
  onClose,
  onPlayingChange,
  hint = 'Treble clef · 4/4 · swung eighths',
  className = '',
}: StaffCardProps) {
  const staffRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<StaffPlayheadLayout | null>(null);
  const scheduleRef = useRef(buildSchedule(playbackNotes, bpm, swing / 100));
  const [playing, setPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState<number | null>(null);

  const setPlaybackState = useCallback(
    (next: boolean) => {
      setPlaying(next);
      onPlayingChange?.(next);
      if (!next) setPlayheadPosition(null);
    },
    [onPlayingChange]
  );

  useEffect(() => {
    const el = staffRef.current;
    if (!el) return;
    layoutRef.current = renderExampleStaff(el, example);
    scheduleRef.current = buildSchedule(playbackNotes, bpm, swing / 100);
    setPlayheadPosition(null);
  }, [example, playbackNotes, bpm, swing]);

  useEffect(() => {
    return () => {
      stopPlayback();
      onPlayingChange?.(false);
    };
  }, [onPlayingChange]);

  const handleClose = () => {
    stopPlayback();
    setPlaybackState(false);
    onClose();
  };

  const handlePlay = () => {
    if (playing) return;
    const layout = layoutRef.current;
    const schedule = buildSchedule(playbackNotes, bpm, swing / 100);
    scheduleRef.current = schedule;
    setPlaybackState(true);
    setPlayheadPosition(layout?.slots[0]?.x ?? 0);

    void playNotes(
      playbackNotes,
      bpm,
      () => setPlaybackState(false),
      swing / 100,
      loop,
      (elapsed) => {
        if (!layout || layout.slots.length === 0) return;
        const x = playheadX(layout, schedule, elapsed);
        setPlayheadPosition(x);
        const scroll = scrollRef.current;
        if (scroll) {
          const target = x - scroll.clientWidth * 0.35;
          scroll.scrollLeft = Math.max(0, target);
        }
      }
    );
  };

  return (
    <div className="staff-backdrop" onClick={handleClose} role="presentation">
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
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="staff-card__scroll" ref={scrollRef}>
          <div className="staff-card__notation-wrap">
            <div ref={staffRef} className="staff-card__notation" aria-label="Staff notation" />
            {playheadPosition !== null && layoutRef.current && (
              <div
                className="staff-playhead"
                style={{
                  left: `${playheadPosition}px`,
                  top: `${layoutRef.current.top}px`,
                  height: `${layoutRef.current.height}px`,
                }}
                aria-hidden
              />
            )}
          </div>
        </div>

        <footer className="staff-card__footer">
          <p className="staff-card__footer-hint">
            Uses your current tempo, swing, and instrument.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePlay}
            disabled={playing}
          >
            {playing ? 'Playing…' : 'Play'}
          </button>
        </footer>
      </div>
    </div>
  );
}
