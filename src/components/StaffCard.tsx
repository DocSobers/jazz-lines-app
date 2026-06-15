import { useCallback, useEffect, useRef, useState } from 'react';
import { renderExampleStaff } from '../lib/notation';
import { playNotes, stopPlayback } from '../lib/playback';
import {
  attachSlotTimes,
  playheadX,
  staffPlayheadElapsed,
  type StaffPlayheadLayout,
} from '../lib/staff-playhead';
import type { Example, Note } from '../types';

interface StaffCardProps {
  example: Example;
  playbackNotes: Note[];
  bpm: number;
  swing: number;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  hint?: string;
  className?: string;
}

function buildTimedLayout(
  container: HTMLDivElement,
  example: Example,
  playbackNotes: Note[],
  bpm: number,
  swing: number
): StaffPlayheadLayout {
  const rendered = renderExampleStaff(container, example);
  const timed = attachSlotTimes(rendered.slots, playbackNotes, bpm, swing);
  return { ...rendered, slots: timed.slots, contentDuration: timed.contentDuration };
}

export default function StaffCard({
  example,
  playbackNotes,
  bpm,
  swing,
  onClose,
  onPlayingChange,
  hint = 'Treble clef · 4/4 · swung eighths',
  className = '',
}: StaffCardProps) {
  const staffRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<StaffPlayheadLayout | null>(null);
  const swingAmount = swing / 100;
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
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
    layoutRef.current = buildTimedLayout(el, example, playbackNotes, bpm, swingAmount);
    setPlayheadPosition(null);
  }, [example, playbackNotes, bpm, swingAmount]);

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
    const el = staffRef.current;
    if (!el) return;
    const layout = buildTimedLayout(el, example, playbackNotes, bpm, swingAmount);
    layoutRef.current = layout;
    setPlaybackState(true);
    setPlayheadPosition(layout.slots[0]?.x ?? 0);

    void playNotes(
      playbackNotes,
      bpm,
      () => setPlaybackState(false),
      swingAmount,
      loop,
      (progress) => {
        if (!layout || layout.slots.length === 0) return;
        const lineElapsed = staffPlayheadElapsed(
          progress.elapsed,
          progress.contentDuration,
          loop,
          progress.totalDuration
        );
        const x = playheadX(layout, lineElapsed);
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
          <div className="staff-card__footer-actions">
            <button
              type="button"
              className={`btn btn--ghost btn--toggle ${loop ? 'btn--toggle-on' : ''}`}
              onClick={() => setLoop((prev) => !prev)}
              disabled={playing}
              aria-pressed={loop}
              title="Repeat until Stop (1/8-note pause between repeats)"
            >
              Loop
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePlay}
              disabled={playing}
            >
              {playing ? 'Playing…' : 'Play'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
