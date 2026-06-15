import type { WheelKey } from './keys';
import { iiViProgression, type ProgressionBar } from './comp-progression';

export type { ChordQuality, ChordSymbol, ProgressionBar } from './comp-progression';
export { chordLabel, iiViProgression, iiViProgressionLabel } from './comp-progression';
export { compInstrumentForMelody, compInstrumentLabel, bassVolumeDb } from './comp-instruments';

/** Total duration of one ii–V–I loop in whole-note beats (4 bars × 4 beats). */
export const II_V_I_LOOP_BEATS = 16;

/**
 * Chord progression backing for Your line.
 * Phase 2: schedule rootless piano voicings on the shared Tone transport.
 */
export function progressionForKey(key: WheelKey): ProgressionBar[] {
  return iiViProgression(key);
}
