import type { InstrumentId } from './instruments';

/** Comp instrument paired with the user's melody choice (avoids piano-on-piano). */
export function compInstrumentForMelody(melody: InstrumentId): InstrumentId {
  return melody === 'piano' ? 'nylon' : 'piano';
}

export function compInstrumentLabel(melody: InstrumentId): string {
  const comp = compInstrumentForMelody(melody);
  if (comp === 'piano') return 'Piano comp';
  return 'Guitar comp';
}
