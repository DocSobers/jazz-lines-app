import { instrumentVolume, type InstrumentId } from './instruments';

/** Comp instrument paired with the user's melody choice (avoids piano-on-piano). */
export function compInstrumentForMelody(melody: InstrumentId): InstrumentId {
  return melody === 'piano' ? 'nylon' : 'piano';
}

export function compInstrumentLabel(melody: InstrumentId): string {
  const comp = compInstrumentForMelody(melody);
  if (comp === 'piano') return 'Piano comp';
  return 'Guitar comp';
}

/** dB offset applied when an instrument is used for backing (under the melody). */
export function compVolumeDb(instrument: InstrumentId): number {
  return instrumentVolume(instrument) - 10;
}
