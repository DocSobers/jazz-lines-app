import type { ChainItem, Example, RegisterJoin } from '../types';

/** Idioms available to signed-out users on /app/demo */
export const DEMO_IDIOM_IDS = [
  'idiom_ii_v_n3',
  'idiom_ii_v_n24',
  'idiom_v_i_n1a',
] as const;

export const DEMO_PLAYER_PATH = '/app/demo';

const DEMO_CHAIN_SPEC: ReadonlyArray<{ id: string; registerJoin?: RegisterJoin }> = [
  { id: 'idiom_ii_v_n3' },
  { id: 'idiom_ii_v_n24', registerJoin: 'asWritten' },
  { id: 'idiom_v_i_n1a', registerJoin: 'align' },
];

/** True when the line matches the built-in demo chain (ignores octave / boundary defaults). */
export function isDefaultDemoChain(chain: ChainItem[]): boolean {
  if (chain.length !== DEMO_CHAIN_SPEC.length) return false;
  return DEMO_CHAIN_SPEC.every((spec, i) => {
    const item = chain[i];
    if (item.example.id !== spec.id) return false;
    const registerJoin = item.registerJoin ?? 'align';
    return registerJoin === (spec.registerJoin ?? 'align');
  });
}

/** Default guest line: II–V #3 → #24 (Written) → V–I #1a (Align). */
export function buildDemoChain(idioms: Example[]): ChainItem[] {
  const items = DEMO_CHAIN_SPEC.map((spec) => {
    const example = idioms.find((e) => e.id === spec.id);
    if (!example) return null;
    return {
      example,
      octave: 0,
      boundaryJoin: 'merge' as const,
      ...(spec.registerJoin ? { registerJoin: spec.registerJoin } : {}),
    };
  });

  if (items.some((item) => item == null)) return [];
  return items as ChainItem[];
}
