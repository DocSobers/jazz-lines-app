import { useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ExampleEditor from './components/ExampleEditor';
import BackingMixer from './components/BackingMixer';
import KeyWheel from './components/KeyWheel';
import StaffCard from './components/StaffCard';
import NavBar from './components/NavBar';
import SiteFooter from './components/SiteFooter';
import { isAdminUser } from './lib/auth';
import CollapsibleSectionHeading from './components/CollapsibleSectionHeading';
import {
  buildDemoChain,
  buildDemoChainWithResolution,
  demoVi1aCardExample,
  DEMO_IDIOM_IDS,
  DEMO_RESOLUTION_ID,
  isDefaultDemoChain,
  isDemoChainWithResolution,
  isDemoResolutionPending,
  syncDemoChainExamples,
  vi1aExampleForLineRhythm,
} from './lib/demo-idioms';
import {
  canOfferTripletCrossBarJoin,
  resolveJoinRhythm,
  resolveLineRhythm,
  supportsLineRhythmVariant,
  usesTripletCrossBarJoin,
} from './lib/idiom-rhythm';
import {
  buildExampleChain,
  exampleChainIdForIds,
  EXAMPLE_CHAINS,
  type ExampleChainId,
} from './lib/example-chains';
import { compInstrumentForMelody, compInstrumentLabel, iiViProgressionLabel } from './lib/comp';
import { applyLineEndingNotes } from './lib/line-ending';
import { INSTRUMENTS, type InstrumentId } from './lib/instruments';
import { type MixerChannel } from './lib/mixer';
import {
  loadMixerDefaults,
  persistMixerDefaults,
  resetMixerToDefaults,
} from './lib/mixer-prefs';
import { REFERENCE_KEY, semitonesFromReference, type WheelKey } from './lib/keys';
import { IDIOM_SECTIONS, JAZZ_IDIOMS, PROGRESSION } from './data/jazz-idioms';
import {
  applyEdits,
  loadEdits,
  persistEdits,
  type ExampleEdits,
} from './lib/example-edits';
import { findCompatibleNext } from './lib/join';
import { canJoin } from './lib/notes';
import {
  endPitchClass,
  flattenChain,
  formatPitchClass,
  notesDurationQuarters,
  notesForIdiomCardPlay,
  prependPickup,
  startPitchClass,
  transposeExample,
} from './lib/notes';
import { warmBassCache, warmDrumCache } from './lib/sample-cache';
import {
  disposePlayback,
  initPlaybackLifecycle,
  playNotes,
  preloadAllInstruments,
  preloadBass,
  preloadDrums,
  preloadInstrument,
  setPlaybackInstrument,
  setMixerLevels,
  stopPlayback,
} from './lib/playback';
import type { BoundaryJoin, ChainItem, Example, JoinRhythm, LineRhythm, Note, RegisterJoin } from './types';
import './App.css';

const OCTAVE_MIN = -3;
const OCTAVE_MAX = 3;
const BEAT_OFFSET_MIN = -4;
const BEAT_OFFSET_MAX = 4;

const SECTION_LABELS: Record<(typeof IDIOM_SECTIONS)[number], string> = {
  'II-V': 'II–V',
  'V-I': 'V–I',
  'I-maj': 'I maj',
};

function joinPitchLabel(prev: Example, next: Example): string {
  const end = formatPitchClass(endPitchClass(prev));
  const start = formatPitchClass(startPitchClass(next));
  return endPitchClass(prev) === startPitchClass(next)
    ? `${end} (shared)`
    : `${end} → ${start}`;
}

function describeChainJoin(prev: ChainItem, curr: ChainItem): {
  details: string[];
  tip?: string;
} {
  const shared = endPitchClass(prev.example) === startPitchClass(curr.example);
  const details: string[] = [`${joinPitchLabel(prev.example, curr.example)}`];

  if (shared) {
    details.push(
      (curr.boundaryJoin ?? 'merge') === 'merge'
        ? 'Once — the boundary note sounds a single time'
        : 'Both — the boundary note plays in each idiom’s register'
    );
  }

  details.push(
    (curr.registerJoin ?? 'align') === 'align'
      ? 'Align — transpose to the prior ending octave'
      : 'Written — keep this idiom in its written register'
  );

  if (shared && (curr.registerJoin ?? 'align') === 'align') {
    if (supportsLineRhythmVariant(curr.example.id)) {
      details.push(
        resolveLineRhythm(curr) === 'book'
          ? 'Line — book triplet rhythm (as in xlsx)'
          : 'Line — demo swung eighths on G–F–E'
      );
    }
    if (canOfferTripletCrossBarJoin(prev.example, curr)) {
      details.push(
        usesTripletCrossBarJoin(curr)
          ? 'Join — #24 through B, then Ab–G–F triplet to E (#1a B dropped)'
          : 'Join — as written at the boundary'
      );
    }
  }

  const offset = curr.beatOffset ?? 0;
  if (offset > 0) {
    details.push(
      `Entry +${offset} — enter ${offset} beat${offset === 1 ? '' : 's'} earlier (strips pickup rests first)`
    );
  } else if (offset < 0) {
    const wait = Math.abs(offset);
    details.push(
      `Entry ${offset} — pad ${wait} beat${wait === 1 ? '' : 's'} after the prior idiom`
    );
  }

  if (curr.octave !== 0) {
    details.push(
      `Octave ${curr.octave > 0 ? '+' : ''}${curr.octave} on this idiom`
    );
  }

  if (
    curr.example.section === 'V-I' &&
    (curr.registerJoin ?? 'align') === 'align'
  ) {
    details.push('V–I leading rests removed so the phrase enters immediately');
  }

  let tip: string | undefined;
  if (
    prev.example.id === 'idiom_ii_v_n3' &&
    curr.example.id === 'idiom_ii_v_n24' &&
    curr.registerJoin === 'asWritten' &&
    curr.octave === 0
  ) {
    tip =
      'Try Octave +1 on II–V #24 to keep the phrase in the same register as II–V #3 (Written plays B5 then B4 at the join).';
  }

  return { details, tip };
}

function ExampleCard({
  example,
  onPlay,
  onStaff,
  onEdit,
  onAdd,
  canAdd,
  canEdit,
  inLine,
  highlight,
  edited,
  demoPrompt,
}: {
  example: Example;
  onPlay: () => void;
  onStaff: () => void;
  onEdit: () => void;
  onAdd: () => void;
  canAdd: boolean;
  canEdit: boolean;
  inLine?: boolean;
  highlight?: boolean;
  edited?: boolean;
  demoPrompt?: boolean;
}) {
  const start = startPitchClass(example);
  const end = endPitchClass(example);

  return (
    <article
      className={`example-card${highlight ? ' example-card--highlight' : ''}${
        demoPrompt ? ' example-card--demo-prompt' : ''
      }`}
    >
      <div className="example-card__header">
        <span className="example-card__section">{example.section}</span>
        <span className="example-card__number">#{example.number}</span>
        <h3>{example.label}</h3>
        {edited && <span className="example-card__edited">edited</span>}
      </div>
      <p className="example-card__meta">
        {formatPitchClass(start)} → {formatPitchClass(end)}
        <span className="example-card__count">{example.notes.length} notes</span>
      </p>
      <div className="example-card__actions">
        <button type="button" className="btn btn--primary" onClick={onPlay}>
          Play
        </button>
        {canEdit && (
          <button type="button" className="btn btn--ghost" onClick={onEdit}>
            Edit
          </button>
        )}
        {canAdd && !inLine && (
          <button
            type="button"
            className="btn btn--action"
            onClick={onAdd}
          >
            Add to line
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--clef"
          onClick={onStaff}
          aria-label="Open music notation window"
          data-tooltip="Click to open the music notation window"
        >
          𝄞
        </button>
      </div>
    </article>
  );
}

interface AppShellProps {
  clerkEnabled: boolean;
  canEdit: boolean;
  demoMode?: boolean;
}

function AppShell({ clerkEnabled, canEdit, demoMode = false }: AppShellProps) {
  const [edits, setEdits] = useState<ExampleEdits>(loadEdits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [showLineStaff, setShowLineStaff] = useState(false);
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [lineLoop, setLineLoop] = useState(false);
  const [backingEnabled, setBackingEnabled] = useState(true);
  const [mixerDefaults] = useState(loadMixerDefaults);
  const [mixerLevels, setMixerLevelsState] = useState(loadMixerDefaults);
  const [showAllJoinIdioms, setShowAllJoinIdioms] = useState(false);
  const [undoBatchSize, setUndoBatchSize] = useState(2);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [instrument, setInstrument] = useState<InstrumentId>('nylon');
  const [selectedKey, setSelectedKey] = useState<WheelKey>(REFERENCE_KEY);
  const [exampleChainId, setExampleChainId] = useState<ExampleChainId | ''>('');

  const baseIdioms = useMemo(() => {
    const all = applyEdits(JAZZ_IDIOMS, edits);
    if (!demoMode) return all;
    const allowed = new Set<string>(DEMO_IDIOM_IDS);
    return all.filter((e) => allowed.has(e.id));
  }, [edits, demoMode]);

  const transposeSemitones = useMemo(
    () => semitonesFromReference(selectedKey),
    [selectedKey]
  );

  const idioms = useMemo(
    () => baseIdioms.map((example) => transposeExample(example, transposeSemitones)),
    [baseIdioms, transposeSemitones]
  );

  const chainExamples = useMemo(() => chain.map((item) => item.example), [chain]);

  const compatible = useMemo(
    () => findCompatibleNext(chainExamples, idioms),
    [chainExamples, idioms]
  );

  const compatibleIds = useMemo(
    () => new Set(compatible.map((e) => e.id)),
    [compatible]
  );

  const demoResolutionPending = demoMode && isDemoResolutionPending(chain);
  const demoResolutionExample = useMemo(
    () => idioms.find((e) => e.id === DEMO_RESOLUTION_ID) ?? null,
    [idioms]
  );

  const toggleSectionCollapsed = (sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const isSectionCollapsed = (sectionId: string) => {
    if (
      demoResolutionPending &&
      (sectionId === 'I-maj' || sectionId === 'compatible')
    ) {
      return false;
    }
    return collapsedSections[sectionId] ?? false;
  };

  const isLineSummaryCollapsed = collapsedSections.lineSummary ?? true;

  const lineNotes = useMemo(() => flattenChain(chain), [chain]);

  const lineNotesWithEnding = useMemo(() => {
    if (lineNotes.length === 0) return lineNotes;
    return applyLineEndingNotes(lineNotes, chain[0]?.example.pickupBeat);
  }, [lineNotes, chain]);

  const lineStaffExample = useMemo((): Example | null => {
    if (chain.length === 0 || lineNotes.length === 0) return null;
    return {
      id: '__line__',
      section: 'Your Jazz Line',
      number: '',
      label: chain.map((item) => item.example.label).join(' · '),
      notes: lineNotesWithEnding,
    };
  }, [chain, lineNotesWithEnding]);

  const play = useCallback(
    async (
      notes: Example['notes'],
      loop = false,
      withBacking = false,
      pickupBeat?: number,
      backingChain?: ChainItem[]
    ) => {
      setPlaying(true);
      await playNotes(
        notes,
        bpm,
        () => setPlaying(false),
        swing / 100,
        loop,
        undefined,
        withBacking && backingChain && backingChain.length > 0
          ? { key: selectedKey, chain: backingChain, pickupBeat }
          : null,
        pickupBeat
      );
    },
    [bpm, swing, selectedKey]
  );

  const handlePlayExample = (example: Example) => {
    const book = baseIdioms.find((e) => e.id === example.id) ?? example;
    const playExample =
      demoMode && book.id === 'idiom_v_i_n1a' ? demoVi1aCardExample(book) : book;
    void play(
      notesForIdiomCardPlay(prependPickup(playExample.notes, playExample.pickupBeat)),
      false,
      false,
      playExample.pickupBeat
    );
  };

  const handlePlayDraft = (notes: Note[], pickupBeat?: number) => {
    void play(prependPickup(notes, pickupBeat), false, false, pickupBeat);
  };

  const syncChainExample = (example: Example) => {
    setChain((prev) =>
      prev.map((item) =>
        item.example.id === example.id ? { ...item, example } : item
      )
    );
  };

  const handleSaveEdit = (id: string, notes: Note[], pickupBeat?: number) => {
    const base = JAZZ_IDIOMS.find((e) => e.id === id);
    if (!base) return;

    const nextEdits = {
      ...edits,
      [id]: { notes, pickupBeat },
    };
    setEdits(nextEdits);
    persistEdits(nextEdits);

    const updated = applyEdits([base], nextEdits)[0];
    syncChainExample(updated);
  };

  const handleResetEdit = (id: string) => {
    const { [id]: _, ...rest } = edits;
    setEdits(rest);
    persistEdits(rest);

    const base = JAZZ_IDIOMS.find((e) => e.id === id);
    if (base) syncChainExample(base);
  };

  const editingExample = editingId
    ? baseIdioms.find((e) => e.id === editingId) ?? null
    : null;

  const staffExample = staffId ? idioms.find((e) => e.id === staffId) ?? null : null;

  const handlePlayChain = () => {
    if (lineNotes.length === 0) return;
    void play(
      lineNotes,
      lineLoop,
      backingEnabled,
      chain[0]?.example.pickupBeat,
      chain
    );
  };

  const handleAdd = (example: Example) => {
    if (chain.some((item) => item.example.id === example.id)) return;
    setExampleChainId('');
    setChain((prev) => {
      const last = prev[prev.length - 1];
      const item: ChainItem = { example, octave: 0, boundaryJoin: 'merge' };
      if (
        demoMode &&
        example.id === DEMO_RESOLUTION_ID &&
        last?.example.id === 'idiom_v_i_n1a' &&
        resolveLineRhythm(last) === 'book'
      ) {
        item.joinRhythm = 'tripletCrossBar';
      }
      return [...prev, item];
    });
  };

  const handleLoadExampleChain = (chainId: ExampleChainId) => {
    const definition = EXAMPLE_CHAINS.find((item) => item.id === chainId);
    if (!definition) return;
    stopPlayback();
    setPlaying(false);
    setExampleChainId(chainId);
    setChain(buildExampleChain(definition.idiomIds, idioms));
  };

  const handleRemoveLast = () => {
    setExampleChainId('');
    setChain((prev) => prev.slice(0, -1));
  };

  const handleRemoveLastN = () => {
    setChain((prev) => prev.slice(0, Math.max(0, prev.length - undoBatchSize)));
  };

  const adjustUndoBatchSize = (delta: number) => {
    setUndoBatchSize((count) =>
      Math.min(chain.length, Math.max(1, count + delta))
    );
  };

  const handleClear = () => {
    stopPlayback();
    setPlaying(false);
    setExampleChainId('');
    setChain(demoMode ? buildDemoChain(idioms) : []);
  };

  const adjustItemOctave = (index: number, delta: number) => {
    setChain((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              octave: Math.min(OCTAVE_MAX, Math.max(OCTAVE_MIN, item.octave + delta)),
            }
          : item
      )
    );
  };

  const adjustBeatOffset = (index: number, delta: number) => {
    if (index <= 0) return;
    setChain((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              beatOffset: Math.min(
                BEAT_OFFSET_MAX,
                Math.max(BEAT_OFFSET_MIN, (item.beatOffset ?? 0) + delta)
              ),
            }
          : item
      )
    );
  };

  const setBoundaryJoin = (index: number, mode: BoundaryJoin) => {
    if (index <= 0) return;
    setChain((prev) =>
      prev.map((item, i) => (i === index ? { ...item, boundaryJoin: mode } : item))
    );
  };

  const setRegisterJoin = (index: number, mode: RegisterJoin) => {
    if (index <= 0) return;
    setChain((prev) =>
      prev.map((item, i) => (i === index ? { ...item, registerJoin: mode } : item))
    );
  };

  const setLineRhythm = (index: number, mode: LineRhythm) => {
    if (index <= 0) return;
    setChain((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next: ChainItem = { ...item, lineRhythm: mode, entryRhythm: undefined };
        if (item.example.id === 'idiom_v_i_n1a') {
          const book = idioms.find((e) => e.id === 'idiom_v_i_n1a');
          if (book) next.example = vi1aExampleForLineRhythm(book, mode);
        }
        return next;
      })
    );
  };

  const setJoinRhythm = (index: number, mode: JoinRhythm) => {
    if (index <= 0) return;
    setChain((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, joinRhythm: mode, entryRhythm: undefined } : item
      )
    );
  };

  const handleMixerChange = (channel: MixerChannel, value: number) => {
    setMixerLevelsState((prev) => {
      const next = { ...prev, [channel]: value };
      persistMixerDefaults(next);
      return next;
    });
  };

  const handleMixerReset = () => {
    const defaults = resetMixerToDefaults();
    setMixerLevelsState(defaults);
  };

  useEffect(() => {
    setMixerLevels(mixerLevels);
    persistMixerDefaults(mixerLevels);
  }, []);

  useEffect(() => {
    setMixerLevels(mixerLevels);
  }, [mixerLevels, instrument]);

  useEffect(() => {
    if (demoMode) setShowAllJoinIdioms(false);
  }, [demoMode]);

  useEffect(() => {
    preloadAllInstruments(instrument);
    const endLifecycle = initPlaybackLifecycle(() => setPlaying(false));
    return () => {
      endLifecycle();
      disposePlayback();
    };
  }, []);

  useEffect(() => {
    setPlaybackInstrument(instrument);
  }, [instrument]);

  useEffect(() => {
    if (!backingEnabled) return;
    preloadInstrument(compInstrumentForMelody(instrument));
    preloadBass();
    preloadDrums();
    void warmBassCache();
    void warmDrumCache();
  }, [backingEnabled, instrument]);

  useEffect(() => {
    if (chain.length === 0) setShowLineStaff(false);
  }, [chain.length]);

  useEffect(() => {
    setUndoBatchSize((count) => Math.min(chain.length, Math.max(1, count)));
  }, [chain.length]);

  useEffect(() => {
    if (demoMode) {
      setChain((prev) => {
        if (prev.length === 0 || isDefaultDemoChain(prev)) {
          return buildDemoChain(idioms);
        }
        if (isDemoChainWithResolution(prev)) {
          return buildDemoChainWithResolution(idioms);
        }
        return syncDemoChainExamples(prev, idioms);
      });
      return;
    }

    setChain((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((item) => {
        const base = baseIdioms.find((e) => e.id === item.example.id);
        if (!base) return item;
        return { ...item, example: transposeExample(base, transposeSemitones) };
      });
    });
  }, [baseIdioms, transposeSemitones, demoMode, idioms]);

  useEffect(() => {
    stopPlayback();
    setPlaying(false);
  }, [lineNotes, bpm, swing, transposeSemitones, instrument]);

  const openIdiomStaff = (id: string) => {
    setShowLineStaff(false);
    setStaffId(id);
  };

  const openLineStaff = () => {
    setStaffId(null);
    setShowLineStaff(true);
  };

  const chainEnd =
    chain.length > 0 ? endPitchClass(chain[chain.length - 1].example) : null;

  const nextProgressionSection = useMemo(() => {
    if (chain.length === 0) return PROGRESSION[0];
    const lastSection = chain[chain.length - 1].example.section;
    const idx = PROGRESSION.indexOf(lastSection as (typeof PROGRESSION)[number]);
    if (idx === -1 || idx >= PROGRESSION.length - 1) return null;
    return PROGRESSION[idx + 1];
  }, [chain]);

  const hasFullProgression = useMemo(
    () =>
      PROGRESSION.every((section) =>
        chain.some((item) => item.example.section === section)
      ),
    [chain]
  );

  const lineDescription = useMemo(() => {
    if (chain.length === 0) {
      return (
        <>
          Chain idioms whose <strong>last note</strong> matches the{' '}
          <strong>next idiom&apos;s first note</strong>. Each row sets how that join behaves — entry
          timing, starting register, rhythm at the boundary, and whether the shared pitch plays once
          or twice.
        </>
      );
    }

    const labels = chain.map((item) => item.example.label).join(' → ');
    const sections = chain.map(
      (item) => SECTION_LABELS[item.example.section as keyof typeof SECTION_LABELS] ?? item.example.section
    );
    const sectionFlow = sections.filter((s, i) => i === 0 || sections[i - 1] !== s).join(' → ');
    const durationQuarters = notesDurationQuarters(lineNotes);
    const barCount = Math.max(1, Math.ceil(durationQuarters / 4));
    const pickup = chain[0].example.pickupBeat;
    const first = chain[0];

    return (
      <>
        <p className="chain-panel__summary-lead">
          <strong>{labels}</strong> in <strong>{selectedKey}</strong> — {chain.length} idiom
          {chain.length === 1 ? '' : 's'} ({sectionFlow}) over about {barCount} bar
          {barCount === 1 ? '' : 's'}.
        </p>

        {(pickup != null && pickup > 0) || first.octave !== 0 ? (
          <p className="chain-panel__summary-section">
            <strong>Opening:</strong>{' '}
            {pickup != null && pickup > 0
              ? 'Pickup before bar 1 — count-in clicks through the pickup rest, then melody enters on the & of beat 4; backing waits until bar 2.'
              : null}
            {pickup != null && pickup > 0 && first.octave !== 0 ? ' ' : null}
            {first.octave !== 0
              ? `First idiom shifted ${first.octave > 0 ? '+' : ''}${first.octave} octave.`
              : null}
          </p>
        ) : null}

        {chain.length > 1 ? (
          <div className="chain-panel__summary-section">
            <strong>Joins:</strong>
            <ul className="chain-panel__summary-list">
              {chain.slice(1).map((item, i) => {
                const { details, tip } = describeChainJoin(chain[i], item);
                return (
                  <li key={`${item.example.id}-${i + 1}`}>
                    <strong>
                      {chain[i].example.label} → {item.example.label}:
                    </strong>{' '}
                    {details.join(' · ')}
                    {tip ? <span className="chain-panel__summary-tip"> {tip}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <p
          className={`chain-panel__summary-section chain-panel__summary-section--progression${
            nextProgressionSection && !hasFullProgression
              ? ' chain-panel__summary-section--progression-action'
              : ''
          }`}
        >
          <strong>Progression:</strong>{' '}
          {hasFullProgression
            ? 'Complete ii–V–I — all three sections are represented in this line.'
            : nextProgressionSection
              ? `Partial ii–V–I — add a ${SECTION_LABELS[nextProgressionSection]} idiom next to complete the cycle.`
              : 'Mixed sections — not following the standard ii–V–I order, or the line extends past I maj.'}
        </p>

        <p className="chain-panel__summary-section">
          <strong>Ending:</strong> Last sounding pitch{' '}
          <strong>{chainEnd && formatPitchClass(chainEnd)}</strong>
          {lineNotesWithEnding.some((n) => n.fermata)
            ? ' — held through the resolution bar with a fermata when you play the line.'
            : '.'}
        </p>

        <p className="chain-panel__summary-section">
          <strong>Playback:</strong>{' '}
          {backingEnabled ? (
            <>
              Backing on — {compInstrumentLabel(instrument)} comp, electric bass, and drums follow{' '}
              {iiViProgressionLabel(selectedKey)} on a strict four-bar grid; comp and bass hold I on
              beat 1 of the resolution bar for three beats, drums stop before that bar.
            </>
          ) : (
            <>Melody only — turn Backing on for comp, bass, and drums in {selectedKey}.</>
          )}
          {lineLoop ? ' Loop repeats the full line with a short rest between passes.' : null}
        </p>
      </>
    );
  }, [
    chain,
    selectedKey,
    hasFullProgression,
    nextProgressionSection,
    backingEnabled,
    chainEnd,
    lineNotes,
    lineNotesWithEnding,
    instrument,
    lineLoop,
  ]);

  const lineSummaryTeaser = useMemo(() => {
    if (chain.length === 0) return 'How chaining and joins work';
    const labels = chain.map((item) => item.example.label).join(' → ');
    return `${labels} in ${selectedKey}`;
  }, [chain, selectedKey]);

  return (
    <div className={`app${demoMode ? ' app--demo' : ''}`}>
      <NavBar
        edits={edits}
        clerkEnabled={clerkEnabled}
        isAdmin={canEdit}
        exampleChainId={
          exampleChainId ||
          exampleChainIdForIds(chain.map((item) => item.example.id))
        }
        onExampleChainChange={demoMode ? undefined : handleLoadExampleChain}
      />

      <header className="header">
        <div>
          <p className="eyebrow">ii–V–I idioms</p>
          <h1>Jazz Lines Player</h1>
          <p className="subtitle">
            {demoMode
              ? 'Demo line: II–V #3 → #24 → V–I #1a — then add I-maj #4 as the resolution tag'
              : 'Build a full ii–V–I line across sections, or chain any idioms freely'}
          </p>
        </div>
        <div className="header__controls">
          <BackingMixer
            melodyInstrument={instrument}
            levels={mixerLevels}
            defaultLevels={mixerDefaults}
            onChange={handleMixerChange}
            onReset={handleMixerReset}
          />
          <KeyWheel selectedKey={selectedKey} onChange={setSelectedKey} />
        </div>
        <div className="transport">
          <label className="bpm-control instrument-control">
            Sound
            <select
              className="instrument-select"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as InstrumentId)}
              aria-label="Playback instrument"
            >
              {INSTRUMENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
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
            className={`btn ${hasFullProgression ? 'btn--action' : 'btn--primary'}`}
            onClick={handlePlayChain}
            disabled={chain.length === 0 || playing}
          >
            Play line
          </button>
          <button
            type="button"
            className={`btn btn--ghost btn--toggle ${lineLoop ? 'btn--toggle-on' : ''}`}
            onClick={() => setLineLoop((prev) => !prev)}
            disabled={chain.length === 0}
            aria-pressed={lineLoop}
            title="Repeat your line until Stop (1/8-note pause between repeats)"
          >
            Loop
          </button>
          <button
            type="button"
            className={`btn btn--ghost btn--toggle ${backingEnabled ? 'btn--toggle-on' : ''}`}
            onClick={() => setBackingEnabled((prev) => !prev)}
            disabled={chain.length === 0}
            aria-pressed={backingEnabled}
            title={
              backingEnabled
                ? `Sock hi-hat + ride + bass + ${compInstrumentLabel(instrument)} · ${iiViProgressionLabel(selectedKey)}`
                : `Closed hi-hat on 2 & 4, ride pattern, bass on 1 & 3 + ${compInstrumentLabel(instrument)} · ii–V–I in ${selectedKey}`
            }
          >
            Backing
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
          <div className="chain-panel__intro">
            <h2>Your Jazz Line</h2>
          </div>
          {chain.length > 0 && (
            <div className="chain-panel__actions">
              <button
                type="button"
                className="btn btn--ghost btn--clef btn--clef--line"
                onClick={openLineStaff}
                aria-label="View full line on staff"
                data-tooltip="View entire line on the staff"
              >
                𝄞
              </button>
              <div className="chain-panel__undo-column">
                <button type="button" className="btn btn--ghost" onClick={handleRemoveLast}>
                  Undo
                </button>
                <div className="chain-panel__undo-batch" aria-label="Undo multiple entries">
                  <span className="chain-panel__undo-batch-label">Last</span>
                  <div className="chain-panel__undo-batch-controls">
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => adjustUndoBatchSize(-1)}
                      disabled={undoBatchSize <= 1}
                      aria-label="Undo one fewer entry"
                    >
                      −
                    </button>
                    <span className="octave-control__value">{undoBatchSize}</span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--icon"
                      onClick={() => adjustUndoBatchSize(1)}
                      disabled={undoBatchSize >= chain.length}
                      aria-label="Undo one more entry"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--undo-batch"
                    onClick={handleRemoveLastN}
                    disabled={undoBatchSize <= 0 || chain.length === 0}
                  >
                    Undo {undoBatchSize}
                  </button>
                </div>
              </div>
              <button type="button" className="btn btn--ghost" onClick={handleClear}>
                Clear All
              </button>
            </div>
          )}
        </div>

        <div
          className={`chain-panel__summary-callout${
            isLineSummaryCollapsed ? ' chain-panel__summary-callout--collapsed' : ''
          }`}
        >
          <button
            type="button"
            className="chain-panel__summary-toggle"
            onClick={() => toggleSectionCollapsed('lineSummary')}
            aria-expanded={!isLineSummaryCollapsed}
            data-tooltip="Show or hide line explanation and join details"
          >
            <span
              className={`chain-panel__summary-chevron${
                isLineSummaryCollapsed ? '' : ' chain-panel__summary-chevron--open'
              }`}
              aria-hidden
            />
            <span className="chain-panel__summary-toggle-label">
              <span className="chain-panel__summary-toggle-title">Line details</span>
              <span className="chain-panel__summary-toggle-teaser">{lineSummaryTeaser}</span>
            </span>
          </button>
          {!isLineSummaryCollapsed ? (
            <div className="chain-panel__summary">{lineDescription}</div>
          ) : null}
        </div>

        {chain.length === 0 ? (
          <p className="empty-state">
            Start with a <strong>II–V</strong> idiom, then add <strong>V–I</strong> and{' '}
            <strong>I maj</strong> to complete the progression — or mix freely.
          </p>
        ) : (
          <>
            <div className="chain-table" role="table" aria-label="Your Jazz Line">
              <div className="chain-table__head" role="row">
                <span className="chain-table__th chain-table__th--num" role="columnheader">
                  #
                </span>
                <span className="chain-table__th chain-table__th--idiom" role="columnheader">
                  Idiom
                </span>
                <span className="chain-table__th chain-table__th--range" role="columnheader">
                  Range
                </span>
                <span className="chain-table__th" role="columnheader">
                  Entry
                </span>
                <span className="chain-table__th" role="columnheader">
                  Start
                </span>
                <span className="chain-table__th" role="columnheader">
                  Line / Join
                </span>
                <span className="chain-table__th" role="columnheader">
                  Octave
                </span>
                <span className="chain-table__th chain-table__th--join" role="columnheader">
                  Switch Joined Notes
                </span>
              </div>
              <ol className="chain-list" role="rowgroup">
                {chain.map((item, i) => (
                  <li key={`${item.example.id}-${i}`} className="chain-table__row" role="row">
                    <span className="chain-list__index" role="cell">
                      {i + 1}
                    </span>
                    <span className="chain-list__label" role="cell">
                      {item.example.label}
                    </span>
                    <span className="chain-table__range" role="cell">
                      {formatPitchClass(startPitchClass(item.example))} →{' '}
                      {formatPitchClass(endPitchClass(item.example))}
                    </span>
                    <div className="chain-table__cell" role="cell">
                      {i > 0 ? (
                        <div
                          className="chain-table__switches beat-offset-control"
                          aria-label={`Entry offset for ${item.example.label}`}
                        >
                          <button
                            type="button"
                            className="btn btn--ghost btn--icon"
                            onClick={() => adjustBeatOffset(i, -1)}
                            disabled={(item.beatOffset ?? 0) <= BEAT_OFFSET_MIN}
                            aria-label={`Enter ${item.example.label} one beat later`}
                          >
                            −
                          </button>
                          <span
                            className="octave-control__value"
                            data-tooltip={(() => {
                              const offset = item.beatOffset ?? 0;
                              if (offset > 0) {
                                return `Enters ${offset} beat${
                                  offset === 1 ? '' : 's'
                                } earlier — strips pickup rests first, then overlaps the prior idiom if needed`;
                              }
                              if (offset < 0) {
                                return `Waits ${Math.abs(offset)} beat${
                                  offset === -1 ? '' : 's'
                                } after the previous idiom before starting`;
                              }
                              return 'Joins sequentially as written (includes any pickup rests)';
                            })()}
                          >
                            {(item.beatOffset ?? 0) > 0
                              ? `+${item.beatOffset}`
                              : (item.beatOffset ?? 0) < 0
                                ? `${item.beatOffset}`
                                : '0'}
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--icon"
                            onClick={() => adjustBeatOffset(i, 1)}
                            disabled={(item.beatOffset ?? 0) >= BEAT_OFFSET_MAX}
                            aria-label={`Enter ${item.example.label} one beat earlier`}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="chain-table__placeholder" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>
                    <div className="chain-table__cell" role="cell">
                      {i > 0 ? (
                        <div
                          className="chain-table__switches"
                          role="group"
                          aria-label={`Starting register for ${item.example.label}`}
                        >
                          <button
                            type="button"
                            className={`btn btn--ghost btn--boundary${
                              (item.registerJoin ?? 'align') === 'align' ? ' btn--toggle-on' : ''
                            }`}
                            onClick={() => setRegisterJoin(i, 'align')}
                            aria-pressed={(item.registerJoin ?? 'align') === 'align'}
                            data-tooltip="Transpose to match the prior ending octave when pitch classes match"
                          >
                            Align
                          </button>
                          <button
                            type="button"
                            className={`btn btn--ghost btn--boundary${
                              item.registerJoin === 'asWritten' ? ' btn--toggle-on' : ''
                            }`}
                            onClick={() => setRegisterJoin(i, 'asWritten')}
                            aria-pressed={item.registerJoin === 'asWritten'}
                            data-tooltip="Keep this idiom in written register — matching boundary pitches play in both octaves"
                          >
                            Written
                          </button>
                        </div>
                      ) : (
                        <span className="chain-table__placeholder" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>
                    <div className="chain-table__cell" role="cell">
                      {i > 0 ? (
                        <div className="chain-table__rhythm-stack">
                          {supportsLineRhythmVariant(item.example.id) ? (
                            <div
                              className="chain-table__switches"
                              role="group"
                              aria-label={`Line rhythm for ${item.example.label}`}
                            >
                              <button
                                type="button"
                                className={`btn btn--ghost btn--boundary${
                                  resolveLineRhythm(item) === 'book' ? ' btn--toggle-on' : ''
                                }`}
                                onClick={() => setLineRhythm(i, 'book')}
                                aria-pressed={resolveLineRhythm(item) === 'book'}
                                data-tooltip="Book triplet line from xlsx (G–F–E as triplet eighths)"
                              >
                                Book
                              </button>
                              <button
                                type="button"
                                className={`btn btn--ghost btn--boundary${
                                  resolveLineRhythm(item) === 'demoSwung' ? ' btn--toggle-on' : ''
                                }`}
                                onClick={() => setLineRhythm(i, 'demoSwung')}
                                aria-pressed={resolveLineRhythm(item) === 'demoSwung'}
                                data-tooltip="Demo swung pairs on G–F–E (card preview rhythm)"
                              >
                                Demo
                              </button>
                            </div>
                          ) : null}
                          {canOfferTripletCrossBarJoin(chain[i - 1].example, item) ? (
                            <div
                              className="chain-table__switches"
                              role="group"
                              aria-label={`Join rhythm for ${item.example.label}`}
                            >
                              <button
                                type="button"
                                className={`btn btn--ghost btn--boundary${
                                  resolveJoinRhythm(item) === 'asWritten' ? ' btn--toggle-on' : ''
                                }`}
                                onClick={() => setJoinRhythm(i, 'asWritten')}
                                aria-pressed={resolveJoinRhythm(item) === 'asWritten'}
                                data-tooltip="Keep written rhythm at the shared pitch"
                              >
                                At Join
                              </button>
                              <button
                                type="button"
                                className={`btn btn--ghost btn--boundary${
                                  usesTripletCrossBarJoin(item) ? ' btn--toggle-on' : ''
                                }`}
                                onClick={() => setJoinRhythm(i, 'tripletCrossBar')}
                                aria-pressed={usesTripletCrossBarJoin(item)}
                                data-tooltip="B–D–G–F–B from #24, then Ab–G–F triplet to E (Once + Align)"
                              >
                                Triplet Join
                              </button>
                            </div>
                          ) : (
                            !supportsLineRhythmVariant(item.example.id) && (
                              <span className="chain-table__placeholder" aria-hidden="true">
                                —
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="chain-table__placeholder" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>
                    <div className="chain-table__cell" role="cell">
                      <div
                        className="chain-table__switches"
                        aria-label={`Octave for ${item.example.label}`}
                      >
                        <button
                          type="button"
                          className="btn btn--ghost btn--icon"
                          onClick={() => adjustItemOctave(i, -1)}
                          disabled={item.octave <= OCTAVE_MIN}
                          aria-label={`Lower ${item.example.label} one octave`}
                        >
                          −
                        </button>
                        <span
                          className="octave-control__value"
                          data-tooltip={
                            item.example.id === 'idiom_ii_v_n24' &&
                            i > 0 &&
                            chain[i - 1]?.example.id === 'idiom_ii_v_n3' &&
                            item.registerJoin === 'asWritten' &&
                            item.octave === 0
                              ? 'Octave +1 keeps II–V #24 in the same register as II–V #3'
                              : undefined
                          }
                        >
                          {item.octave > 0 ? `+${item.octave}` : item.octave}
                        </span>
                        <button
                          type="button"
                          className="btn btn--ghost btn--icon"
                          onClick={() => adjustItemOctave(i, 1)}
                          disabled={item.octave >= OCTAVE_MAX}
                          aria-label={`Raise ${item.example.label} one octave`}
                          data-tooltip={
                            item.example.id === 'idiom_ii_v_n24' &&
                            i > 0 &&
                            chain[i - 1]?.example.id === 'idiom_ii_v_n3' &&
                            item.registerJoin === 'asWritten' &&
                            item.octave === 0
                              ? 'Shift II–V #24 up to match II–V #3’s register'
                              : undefined
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="chain-table__cell chain-table__cell--join" role="cell">
                      {i < chain.length - 1 && canJoin(item.example, chain[i + 1].example) ? (
                        <div
                          className="chain-table__switches"
                          role="group"
                          aria-label={`Shared note with ${chain[i + 1].example.label}`}
                        >
                          <button
                            type="button"
                            className={`btn btn--ghost btn--boundary${
                              (chain[i + 1].boundaryJoin ?? 'merge') === 'merge'
                                ? ' btn--toggle-on'
                                : ''
                            }`}
                            onClick={() => setBoundaryJoin(i + 1, 'merge')}
                            aria-pressed={(chain[i + 1].boundaryJoin ?? 'merge') === 'merge'}
                            data-tooltip="With Align: shared note plays once. With Written: both boundary notes are kept."
                          >
                            Once
                          </button>
                          <button
                            type="button"
                            className={`btn btn--ghost btn--boundary${
                              chain[i + 1].boundaryJoin === 'restate' ? ' btn--toggle-on' : ''
                            }`}
                            onClick={() => setBoundaryJoin(i + 1, 'restate')}
                            aria-pressed={chain[i + 1].boundaryJoin === 'restate'}
                            data-tooltip="Each idiom plays fully — the shared note sounds at the end and again at the start"
                          >
                            Both
                          </button>
                        </div>
                      ) : i < chain.length - 1 ? (
                        <span className="chain-table__join-note">
                          ↳ {formatPitchClass(endPitchClass(item.example))}
                        </span>
                      ) : (
                        <span className="chain-table__placeholder" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {demoResolutionPending && demoResolutionExample && (
              <div className="demo-resolution-callout" role="note">
                <p>
                  <strong>Next step — I maj resolution:</strong> V–I #1a ends on{' '}
                  <strong>{formatPitchClass(endPitchClass(chain[chain.length - 1].example))}</strong>.
                  Scroll to the <strong>I maj</strong> section and use{' '}
                  <strong>Add to line</strong> on <strong>{demoResolutionExample.label}</strong> to
                  complete the phrase. Leave <strong>Rhythm</strong> on{' '}
                  <strong>As Written</strong> so the tag keeps its swung feel at the join.
                </p>
              </div>
            )}
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

      {chain.length > 0 && (
        <section className="compatible-section">
          <div className="compatible-section__top">
            <CollapsibleSectionHeading
              title="Can join next"
              collapsed={isSectionCollapsed('compatible')}
              onToggle={() => toggleSectionCollapsed('compatible')}
              className="compatible-section__heading"
            />
            {!demoMode && (
              <button
                type="button"
                className={`btn btn--ghost btn--toggle ${showAllJoinIdioms ? 'btn--toggle-on' : ''}`}
                onClick={() => setShowAllJoinIdioms((prev) => !prev)}
                aria-pressed={showAllJoinIdioms}
              >
                Show all
              </button>
            )}
          </div>
          {!isSectionCollapsed('compatible') && (
          <div className="example-grid">
            {(showAllJoinIdioms && !demoMode ? idioms : compatible).map((example) => {
              const inChain = chain.some((item) => item.example.id === example.id);
              const canJoin = compatibleIds.has(example.id);
              const demoPrompt =
                demoResolutionPending && example.id === DEMO_RESOLUTION_ID;
              return (
                <ExampleCard
                  key={example.id}
                  example={example}
                  onPlay={() => handlePlayExample(example)}
                  onStaff={() => openIdiomStaff(example.id)}
                  onEdit={() => setEditingId(example.id)}
                  onAdd={() => handleAdd(example)}
                  canAdd={!inChain}
                  canEdit={canEdit}
                  inLine={inChain}
                  highlight={(canJoin && !showAllJoinIdioms) || demoPrompt}
                  demoPrompt={demoPrompt}
                  edited={Boolean(edits[example.id])}
                />
              );
            })}
          </div>
          )}
          {!isSectionCollapsed('compatible') && !showAllJoinIdioms && compatible.length === 0 && (
            <p className="join-hint join-hint--none">
              {demoMode ? (
                <>
                  No demo idioms start on{' '}
                  <strong>{chainEnd && formatPitchClass(chainEnd)}</strong> — browse the section
                  lists below.
                </>
              ) : (
                <>
                  No idioms start on <strong>{chainEnd && formatPitchClass(chainEnd)}</strong> —
                  use <strong>Show all</strong> to browse every idiom.
                </>
              )}
            </p>
          )}
        </section>
      )}

      {IDIOM_SECTIONS.map((section) => {
        const sectionExamples = idioms.filter((e) => e.section === section);
        if (sectionExamples.length === 0) return null;
        const isNextInProgression = nextProgressionSection === section && chain.length > 0;
        const isDemoResolutionSection = demoResolutionPending && section === 'I-maj';
        const sectionCollapsed = isSectionCollapsed(section);

        return (
          <section
            key={section}
            className={`page-section ${isNextInProgression || isDemoResolutionSection ? 'page-section--next' : ''}`}
          >
            <CollapsibleSectionHeading
              title={`${SECTION_LABELS[section]} idioms`}
              collapsed={sectionCollapsed}
              onToggle={() => toggleSectionCollapsed(section)}
            />
            {!sectionCollapsed && isNextInProgression && (
              <p className="section-hint">Suggested next in ii–V–I</p>
            )}
            {!sectionCollapsed && isDemoResolutionSection && (
              <div className="demo-resolution-callout demo-resolution-callout--section" role="note">
                <p>
                  Add <strong>I-maj #4</strong> below as your <strong>I maj resolution</strong> — it
                  joins on E where V–I #1a ends. Click <strong>Add to line</strong> on the
                  highlighted card to extend the demo phrase.
                </p>
              </div>
            )}
            {!sectionCollapsed && (
            <div className="example-grid">
              {sectionExamples.map((example) => {
                const inChain = chain.some((item) => item.example.id === example.id);
                const matchesNext =
                  chain.length > 0 && compatibleIds.has(example.id);
                const demoPrompt =
                  demoResolutionPending && example.id === DEMO_RESOLUTION_ID;

                if (showAllJoinIdioms && chain.length > 0 && !demoPrompt) return null;
                if (matchesNext && !inChain && !demoPrompt) return null;

                return (
                  <ExampleCard
                    key={example.id}
                    example={example}
                    onPlay={() => handlePlayExample(example)}
                    onStaff={() => openIdiomStaff(example.id)}
                    onEdit={() => setEditingId(example.id)}
                    onAdd={() => handleAdd(example)}
                    canAdd={!inChain}
                    canEdit={canEdit}
                    inLine={inChain}
                    highlight={demoPrompt}
                    demoPrompt={demoPrompt}
                    edited={Boolean(edits[example.id])}
                  />
                );
              })}
            </div>
            )}
          </section>
        );
      })}

      <SiteFooter variant="app">
        {!demoMode && (
          <p>
            Data from <code>jazz_idoms.xlsx</code>. Edits save in this browser; admins
            can <strong>Export XLSX</strong>, replace the project file, then run{' '}
            <code>npm run import-idioms</code>.
          </p>
        )}
      </SiteFooter>

      {showLineStaff && lineStaffExample && (
        <StaffCard
          example={lineStaffExample}
          playbackNotes={lineNotes}
          bpm={bpm}
          swing={swing}
          className="staff-card--line"
          hint={`${chain.length} idiom${chain.length !== 1 ? 's' : ''} · Treble clef · 4/4 · swung eighths`}
          onClose={() => setShowLineStaff(false)}
          onPlayingChange={setPlaying}
        />
      )}

      {staffExample && (
        <StaffCard
          example={staffExample}
          playbackNotes={notesForIdiomCardPlay(
            prependPickup(staffExample.notes, staffExample.pickupBeat)
          )}
          bpm={bpm}
          swing={swing}
          onClose={() => setStaffId(null)}
          onPlayingChange={setPlaying}
        />
      )}

      {canEdit && editingExample && (
        <ExampleEditor
          example={editingExample}
          isCustomized={Boolean(edits[editingExample.id])}
          onClose={() => setEditingId(null)}
          onSave={(notes, pickupBeat) =>
            handleSaveEdit(editingExample.id, notes, pickupBeat)
          }
          onReset={() => handleResetEdit(editingExample.id)}
          onPlay={handlePlayDraft}
        />
      )}
    </div>
  );
}

function AppWithClerk() {
  const { user, isLoaded } = useUser();
  const canEdit = isLoaded && isAdminUser(user);
  return <AppShell clerkEnabled canEdit={canEdit} />;
}

interface PlayerAppProps {
  clerkEnabled?: boolean;
  demoMode?: boolean;
}

export default function PlayerApp({
  clerkEnabled = false,
  demoMode = false,
}: PlayerAppProps) {
  if (demoMode) {
    return <AppShell clerkEnabled={clerkEnabled} canEdit={false} demoMode />;
  }
  if (clerkEnabled) return <AppWithClerk />;
  return <AppShell clerkEnabled={false} canEdit={false} />;
}
