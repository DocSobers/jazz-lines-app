import type { ChainItem, Example, Note, RegisterJoin, EntryRhythm } from '../types';

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
  entryRhythm?: EntryRhythm;
}> = [
  { id: 'idiom_ii_v_n3' },
  { id: 'idiom_ii_v_n24', registerJoin: 'asWritten' },
  { id: 'idiom_v_i_n1a', registerJoin: 'align' },
];

/** True when the line matches the built-in three-idiom demo chain. */
export function isDefaultDemoChain(chain: ChainItem[]): boolean {
  if (chain.length !== DEMO_CHAIN_SPEC.length) return false;
  return DEMO_CHAIN_SPEC.every((spec, i) => {
    const item = chain[i];
    if (item.example.id !== spec.id) return false;
    const registerJoin = item.registerJoin ?? 'align';
    const entryRhythm = item.entryRhythm ?? 'asWritten';
    return (
      registerJoin === (spec.registerJoin ?? 'align') &&
      entryRhythm === (spec.entryRhythm ?? 'asWritten')
    );
  });
}

/** Demo core plus optional I-maj #4 resolution the user appended. */
export function isDemoChainWithResolution(chain: ChainItem[]): boolean {
  if (chain.length !== DEMO_CHAIN_SPEC.length + 1) return false;
  if (chain[DEMO_CHAIN_SPEC.length]?.example.id !== DEMO_RESOLUTION_ID) return false;
  return isDefaultDemoChain(chain.slice(0, DEMO_CHAIN_SPEC.length));
}

/** Demo line before or after the user adds the resolution idiom (for key-wheel sync). */
export function matchesDemoLine(chain: ChainItem[]): boolean {
  return isDefaultDemoChain(chain) || isDemoChainWithResolution(chain);
}

export function isDemoResolutionPending(chain: ChainItem[]): boolean {
  return isDefaultDemoChain(chain);
}

/** Default guest line: II–V #3 → #24 (Written) → V–I #1a (Align, As Written rhythm). */
export function buildDemoChain(idioms: Example[]): ChainItem[] {
  const items = DEMO_CHAIN_SPEC.map((spec) => {
    const example = idioms.find((e) => e.id === spec.id);
    if (!example) return null;
    return {
      example,
      octave: 0,
      boundaryJoin: 'merge' as const,
      ...(spec.registerJoin ? { registerJoin: spec.registerJoin } : {}),
      ...(spec.entryRhythm ? { entryRhythm: spec.entryRhythm } : {}),
    };
  });

  if (items.some((item) => item == null)) return [];
  return items as ChainItem[];
}

export function buildDemoChainWithResolution(idioms: Example[]): ChainItem[] {
  const core = buildDemoChain(idioms);
  const resolution = idioms.find((e) => e.id === DEMO_RESOLUTION_ID);
  if (!resolution || core.length === 0) return core;
  return [...core, { example: resolution, octave: 0, boundaryJoin: 'merge' as const }];
}

/** Swung-eighth demo copy of V–I #1a (full app keeps triplet-book rhythm). */
export function applyDemoIdiomOverrides(examples: Example[]): Example[] {
  return examples.map((example) =>
    example.id === 'idiom_v_i_n1a'
      ? { ...example, notes: DEMO_VI_1A_NOTES.map((note) => ({ ...note })) }
      : example
  );
}
