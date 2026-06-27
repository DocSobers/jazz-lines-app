import type { ChainItem, Example } from '../types';

export type ExampleChainId = 'chained-ii-v' | 'v-i' | 'i-maj';

export interface ExampleChainDefinition {
  id: ExampleChainId;
  label: string;
  description: string;
  idiomIds: readonly string[];
}

/** Preset lines that join cleanly at each boundary. */
export const EXAMPLE_CHAINS: ExampleChainDefinition[] = [
  {
    id: 'chained-ii-v',
    label: 'Chained II/II–V',
    description: 'II–V #5 → II–V #22',
    idiomIds: ['idiom_ii_v_n5', 'idiom_ii_v_n22'],
  },
  {
    id: 'v-i',
    label: 'V–I',
    description: 'II–V #10 → V–I #11',
    idiomIds: ['idiom_ii_v_n10', 'idiom_v_i_n11'],
  },
  {
    id: 'i-maj',
    label: 'I maj',
    description: 'II–V #10 → V–I #11 → I maj #10',
    idiomIds: ['idiom_ii_v_n10', 'idiom_v_i_n11', 'idiom_i_maj_n10'],
  },
];

export function buildExampleChain(
  idiomIds: readonly string[],
  idioms: Example[]
): ChainItem[] {
  return idiomIds
    .map((id) => idioms.find((example) => example.id === id))
    .filter((example): example is Example => example != null)
    .map((example) => ({ example, octave: 0, boundaryJoin: 'merge' as const }));
}

export function exampleChainIdForIds(
  idiomIds: readonly string[]
): ExampleChainId | '' {
  const match = EXAMPLE_CHAINS.find(
    (chain) =>
      chain.idiomIds.length === idiomIds.length &&
      chain.idiomIds.every((id, index) => id === idiomIds[index])
  );
  return match?.id ?? '';
}
