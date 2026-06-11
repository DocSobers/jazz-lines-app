import type { Example } from '../types';
import { canJoin, endPitchClass, startPitchClass } from './notes';

export function findCompatibleNext(
  chain: Example[],
  catalog: Example[]
): Example[] {
  if (chain.length === 0) return catalog;

  const last = chain[chain.length - 1];
  const used = new Set(chain.map((e) => e.id));

  return catalog.filter(
    (candidate) => !used.has(candidate.id) && canJoin(last, candidate)
  );
}

export function findCompatibleStarters(
  catalog: Example[],
  targetEndPitch: string
): Example[] {
  return catalog.filter((e) => startPitchClass(e) === targetEndPitch);
}

export { canJoin, endPitchClass, startPitchClass };
