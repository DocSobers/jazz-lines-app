import type { Sampler } from 'tone';
import { createFluteSampler } from './flute-sampler';
import { createGuitarSampler } from './guitar-sampler';
import { createPianoSampler } from './piano-sampler';

export type InstrumentId = 'nylon' | 'flute' | 'piano';

export const INSTRUMENTS: { id: InstrumentId; label: string }[] = [
  { id: 'nylon', label: 'Nylon Acoustic' },
  { id: 'flute', label: 'Flute' },
  { id: 'piano', label: 'Piano' },
];

const VOLUME: Record<InstrumentId, number> = {
  nylon: -2,
  flute: -4,
  piano: -8,
};

export function createInstrumentSampler(
  id: InstrumentId,
  onload?: () => void
): Sampler {
  switch (id) {
    case 'nylon':
      return createGuitarSampler(onload);
    case 'flute':
      return createFluteSampler(onload);
    case 'piano':
      return createPianoSampler(onload);
    default:
      return createGuitarSampler(onload);
  }
}

export function instrumentVolume(id: InstrumentId): number {
  return VOLUME[id];
}
