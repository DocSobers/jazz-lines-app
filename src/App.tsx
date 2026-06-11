import { useCallback, useEffect, useMemo, useState } from 'react';
import { IDIOM_SECTIONS, JAZZ_IDIOMS, PROGRESSION } from './data/jazz-idioms';
import { findCompatibleNext } from './lib/join';
import {
  endPitchClass,
  flattenChain,
  formatPitchClass,
  startPitchClass,
} from './lib/notes';
import { disposePlayback, playNotes, stopPlayback } from './lib/playback';
import type { Example } from './types';
import './App.css';

const SECTION_LABELS: Record<(typeof IDIOM_SECTIONS)[number], string> = {
  'II-V': 'II–V',
  'V-I': 'V–I',
  'I-maj': 'I maj',
};

function ExampleCard({
  example,
  onPlay,
  onAdd,
  canAdd,
  disabled,
  highlight,
}: {
  example: Example;
  onPlay: () => void;
  onAdd: () => void;
  canAdd: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const start = startPitchClass(example);
  const end = endPitchClass(example);

  return (
    <article
      className={`example-card ${highlight ? 'example-card--highlight' : ''} ${disabled ? 'example-card--disabled' : ''}`}
    >
      <div className="example-card__header">
        <span className="example-card__section">{example.section}</span>
        <span className="example-card__number">#{example.number}</span>
        <h3>{example.label}</h3>
      </div>
      <p className="example-card__meta">
        {formatPitchClass(start)} → {formatPitchClass(end)}
        <span className="example-card__count">{example.notes.length} notes</span>
      </p>
      <div className="example-card__actions">
        <button type="button" className="btn btn--ghost" onClick={onPlay}>
          Play
        </button>
        {canAdd && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onAdd}
            disabled={disabled}
          >
            Add to line
          </button>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [chain, setChain] = useState<Example[]>([]);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(100);
  const [playing, setPlaying] = useState(false);

  const compatible = useMemo(
    () => findCompatibleNext(chain, JAZZ_IDIOMS),
    [chain]
  );

  const compatibleIds = useMemo(
    () => new Set(compatible.map((e) => e.id)),
    [compatible]
  );

  const flattened = useMemo(() => flattenChain(chain), [chain]);

  const play = useCallback(
    async (notes: Example['notes']) => {
      setPlaying(true);
      await playNotes(notes, bpm, () => setPlaying(false), swing / 100);
    },
    [bpm, swing]
  );

  const handlePlayExample = (example: Example) => {
    void play(example.notes);
  };

  const handlePlayChain = () => {
    if (flattened.length === 0) return;
    void play(flattened);
  };

  const handleAdd = (example: Example) => {
    if (chain.some((e) => e.id === example.id)) return;
    setChain((prev) => [...prev, example]);
  };

  const handleRemoveLast = () => {
    setChain((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    stopPlayback();
    setPlaying(false);
    setChain([]);
  };

  useEffect(() => () => disposePlayback(), []);

  const chainEnd =
    chain.length > 0 ? endPitchClass(chain[chain.length - 1]) : null;

  const nextProgressionSection = useMemo(() => {
    if (chain.length === 0) return PROGRESSION[0];
    const lastSection = chain[chain.length - 1].section;
    const idx = PROGRESSION.indexOf(lastSection as (typeof PROGRESSION)[number]);
    if (idx === -1 || idx >= PROGRESSION.length - 1) return null;
    return PROGRESSION[idx + 1];
  }, [chain]);

  const hasFullProgression = useMemo(
    () => PROGRESSION.every((section) => chain.some((e) => e.section === section)),
    [chain]
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">ii–V–I idioms</p>
          <h1>Jazz Lines Player</h1>
          <p className="subtitle">
            Build a full ii–V–I line across sections, or chain any idioms freely
          </p>
        </div>
        <div className="transport">
          <label className="bpm-control">
            BPM
            <input
              type="range"
              min={60}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <span>{bpm}</span>
          </label>
          <label className="bpm-control">
            Swing
            <input
              type="range"
              min={0}
              max={100}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
            />
            <span>{swing}%</span>
          </label>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePlayChain}
            disabled={chain.length === 0 || playing}
          >
            Play line
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              stopPlayback();
              setPlaying(false);
            }}
            disabled={!playing}
          >
            Stop
          </button>
        </div>
      </header>

      <section className="chain-panel">
        <div className="chain-panel__top">
          <h2>Your line</h2>
          {chain.length > 0 && (
            <div className="chain-panel__actions">
              <button type="button" className="btn btn--ghost" onClick={handleRemoveLast}>
                Undo
              </button>
              <button type="button" className="btn btn--ghost" onClick={handleClear}>
                Clear
              </button>
            </div>
          )}
        </div>

        {chain.length === 0 ? (
          <p className="empty-state">
            Start with a <strong>II–V</strong> idiom, then add <strong>V–I</strong> and{' '}
            <strong>I maj</strong> to complete the progression — or mix freely.
          </p>
        ) : (
          <>
            <ol className="chain-list">
              {chain.map((ex, i) => (
                <li key={`${ex.id}-${i}`}>
                  <span className="chain-list__index">{i + 1}</span>
                  <span>{ex.label}</span>
                  {i < chain.length - 1 && (
                    <span className="chain-list__join">
                      ↳ {formatPitchClass(endPitchClass(ex))}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {chainEnd && compatible.length > 0 && (
              <p className="join-hint">
                Ends on <strong>{formatPitchClass(chainEnd)}</strong> —{' '}
                {compatible.length} idiom{compatible.length !== 1 ? 's' : ''}{' '}
                start on the same note (highlighted below)
              </p>
            )}
            {nextProgressionSection && !hasFullProgression && (
              <p className="join-hint join-hint--progression">
                ii–V–I: add a <strong>{SECTION_LABELS[nextProgressionSection]}</strong>{' '}
                idiom next
              </p>
            )}
            {hasFullProgression && (
              <p className="join-hint join-hint--complete">
                Complete ii–V–I line — hit <strong>Play line</strong>
              </p>
            )}
            {chainEnd && (
              <p className="join-hint">
                Or add any idiom from any section
              </p>
            )}
          </>
        )}
      </section>

      {chain.length > 0 && compatible.length > 0 && (
        <section className="compatible-section">
          <h2>Can join next</h2>
          <div className="example-grid">
            {compatible.map((example) => (
              <ExampleCard
                key={example.id}
                example={example}
                onPlay={() => handlePlayExample(example)}
                onAdd={() => handleAdd(example)}
                canAdd
                highlight
              />
            ))}
          </div>
        </section>
      )}

      {IDIOM_SECTIONS.map((section) => {
        const sectionExamples = JAZZ_IDIOMS.filter((e) => e.section === section);
        const isNextInProgression = nextProgressionSection === section && chain.length > 0;

        return (
          <section
            key={section}
            className={`page-section ${isNextInProgression ? 'page-section--next' : ''}`}
          >
            <h2>{SECTION_LABELS[section]} idioms</h2>
            {isNextInProgression && (
              <p className="section-hint">Suggested next in ii–V–I</p>
            )}
            <div className="example-grid">
              {sectionExamples.map((example) => {
                const inChain = chain.some((e) => e.id === example.id);
                const matchesNext =
                  chain.length > 0 && compatibleIds.has(example.id);

                if (matchesNext && !inChain) return null;

                return (
                  <ExampleCard
                    key={example.id}
                    example={example}
                    onPlay={() => handlePlayExample(example)}
                    onAdd={() => handleAdd(example)}
                    canAdd={!inChain}
                    disabled={inChain}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <footer className="footer">
        <p>
          Data from <code>jazz_idoms.xlsx</code> — run{' '}
          <code>npm run import-idioms</code> after updating the spreadsheet.
        </p>
      </footer>
    </div>
  );
}
