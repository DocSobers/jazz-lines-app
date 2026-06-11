import type { ChainItem, Example } from '../types';

/** Idioms available to signed-out users on /app/demo */
export const DEMO_IDIOM_IDS = ['idiom_ii_v_n1a', 'idiom_ii_v_n2'] as const;

export const DEMO_PLAYER_PATH = '/app/demo';

/** Default guest line: II–V #1a → #2 in the same register. */
export function buildDemoChain(idioms: Example[]): ChainItem[] {
  const first = idioms.find((e) => e.id === DEMO_IDIOM_IDS[0]);
  const second = idioms.find((e) => e.id === DEMO_IDIOM_IDS[1]);
  if (!first || !second) return [];
  return [
    { example: first, octave: 0 },
    { example: second, octave: 0 },
  ];
}
