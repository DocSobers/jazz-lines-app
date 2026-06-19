import { JAZZ_IDIOMS } from '../data/jazz-idioms';
import { resolveJoinRhythm, resolveLineRhythm } from './idiom-rhythm';
import { semitonesBetween, transposeNotesBySemitones } from './notes';
import type { ChainItem, Example, JoinRhythm, LineRhythm, Note, RegisterJoin } from '../types';

/** Idioms available to signed-out users on /app/demo */
export const DEMO_IDIOM_IDS = [
  'idiom_ii_v_n3',
  'idiom_ii_v_n24',
  'idiom_v_i_n1a',
  'idiom_i_maj_n4',
] as const;

/** Suggested I maj resolution for the demo line (user adds manually). */
export const DEMO_RESOLUTION_ID = 'idiom_i_maj_n4';

export const DEMO_PLAYER_PATH = '/app/demo';

/** Demo V–I #1a: swung 4t/8t pairs (no triplet run on G–F–E). */
export const DEMO_VI_1A_NOTES: Note[] = [
  { rest: true, pitch: 'R', duration: '2n' },
  { pitch: 'B3', duration: '4t' },
  { pitch: 'Ab4', duration: '8t' },
  { pitch: 'G4', duration: '4t' },
  { pitch: 'F4', duration: '8t' },
  { pitch: 'E4', duration: '8n' },
];

const DEMO_CHAIN_SPEC: ReadonlyArray<{
  id: string;
  registerJoin?: RegisterJoin;
  lineRhythm?: LineRhythm;
  joinRhythm?: JoinRhythm;
}> = [
  { id: 'idiom_ii_v_n3' },
  { id: 'idiom_ii_v_n24', registerJoin: 'asWritten' },
  {
    id: 'idiom_v_i_n1a',
    registerJoin: 'align',
    lineRhythm: 'book',
    joinRhythm: 'tripletCrossBar',
  },
];

/** Swung-eighth demo copy of V–I #1a at the line’s current key. */
export function demoVi1aNotesForBook(transposedBookExample: Example): Note[] {
  const refBook = JAZZ_IDIOMS.find((e) => e.id === 'idiom_v_i_n1a');
  if (!refBook) return DEMO_VI_1A_NOTES.map((note) => ({ ...note }));

  const refPitch = refBook.notes.find((note) => !note.rest)?.pitch;
  const transPitch = transposedBookExample.notes.find((note) => !note.rest)?.pitch;
  if (!refPitch || !transPitch) return DEMO_VI_1A_NOTES.map((note) => ({ ...note }));

  const semitones = semitonesBetween(refPitch, transPitch);
  return transposeNotesBySemitones(DEMO_VI_1A_NOTES, semitones);
}

/** Book triplet line vs demo swung eighths for V–I #1a. */
export function vi1aExampleForLineRhythm(
  transposedBookExample: Example,
  lineRhythm: LineRhythm = 'demoSwung'
): Example {
  if (lineRhythm === 'book') return transposedBookExample;
  return {
    ...transposedBookExample,
    notes: demoVi1aNotesForBook(transposedBookExample),
  };
}

function syncDemoChainItemExample(item: ChainItem, transposedBook: Example): ChainItem {
  if (item.example.id !== 'idiom_v_i_n1a') {
    return { ...item, example: transposedBook };
  }
  return {
    ...item,
    example: vi1aExampleForLineRhythm(transposedBook, resolveLineRhythm(item)),
  };
}

function matchesDemoSpecItem(
  item: ChainItem,
  spec: (typeof DEMO_CHAIN_SPEC)[number]
): boolean {
  if (item.example.id !== spec.id) return false;
  const registerJoin = item.registerJoin ?? 'align';
  if (registerJoin !== (spec.registerJoin ?? 'align')) return false;
  if (spec.lineRhythm && resolveLineRhythm(item) !== spec.lineRhythm) return false;
  if (spec.joinRhythm && resolveJoinRhythm(item) !== spec.joinRhythm) return false;
  return true;
}

/** True when the line matches the built-in three-idiom demo chain. */
export function isDefaultDemoChain(chain: ChainItem[]): boolean {
  if (chain.length !== DEMO_CHAIN_SPEC.length) return false;
  return DEMO_CHAIN_SPEC.every((spec, i) => matchesDemoSpecItem(chain[i], spec));
}

/** Demo core plus optional I-maj #4 resolution the user appended. */
export function isDemoChainWithResolution(chain: ChainItem[]): boolean {
  if (chain.length !== DEMO_CHAIN_SPEC.length + 1) return false;
  if (chain[DEMO_CHAIN_SPEC.length]?.example.id !== DEMO_RESOLUTION_ID) return false;
  const core = chain.slice(0, DEMO_CHAIN_SPEC.length);
  if (!isDefaultDemoChain(core)) return false;
  return resolveJoinRhythm(chain[DEMO_CHAIN_SPEC.length]) === 'tripletCrossBar';
}

/** Demo line before or after the user adds the resolution idiom (for key-wheel sync). */
export function matchesDemoLine(chain: ChainItem[]): boolean {
  return isDefaultDemoChain(chain) || isDemoChainWithResolution(chain);
}

export function isDemoResolutionPending(chain: ChainItem[]): boolean {
  return isDefaultDemoChain(chain);
}

/** Default guest line: II–V #3 → #24 (Written) → V–I #1a (book line, Ab–G–F triplet join). */
export function buildDemoChain(idioms: Example[]): ChainItem[] {
  const items = DEMO_CHAIN_SPEC.map((spec) => {
    const book = idioms.find((e) => e.id === spec.id);
    if (!book) return null;
    const lineRhythm = spec.lineRhythm;
    const joinRhythm = spec.joinRhythm;
    const example =
      spec.id === 'idiom_v_i_n1a'
        ? vi1aExampleForLineRhythm(book, lineRhythm ?? 'book')
        : book;
    return {
      example,
      octave: 0,
      boundaryJoin: 'merge' as const,
      ...(spec.registerJoin ? { registerJoin: spec.registerJoin } : {}),
      ...(lineRhythm ? { lineRhythm } : {}),
      ...(joinRhythm ? { joinRhythm } : {}),
    };
  });

  if (items.some((item) => item == null)) return [];
  return items as ChainItem[];
}

export function buildDemoChainWithResolution(idioms: Example[]): ChainItem[] {
  const core = buildDemoChain(idioms);
  const resolution = idioms.find((e) => e.id === DEMO_RESOLUTION_ID);
  if (!resolution || core.length === 0) return core;
  return [
    ...core,
    {
      example: resolution,
      octave: 0,
      boundaryJoin: 'merge' as const,
      joinRhythm: 'tripletCrossBar' as const,
    },
  ];
}

/** Keep demo V–I #1a note variant when transposing the chain. */
export function syncDemoChainExamples(
  chain: ChainItem[],
  idioms: Example[]
): ChainItem[] {
  return chain.map((item) => {
    const book = idioms.find((e) => e.id === item.example.id);
    if (!book) return item;
    return syncDemoChainItemExample(item, book);
  });
}

/** Card preview/play on demo: always demo swung eighths. */
export function demoVi1aCardExample(transposedBook: Example): Example {
  return vi1aExampleForLineRhythm(transposedBook, 'demoSwung');
}

/** @deprecated Use vi1aExampleForLineRhythm */
export function vi1aExampleForEntry(
  transposedBookExample: Example,
  entryRhythm: 'asWritten' | 'triplet' = 'asWritten'
): Example {
  return vi1aExampleForLineRhythm(
    transposedBookExample,
    entryRhythm === 'triplet' ? 'book' : 'demoSwung'
  );
}
