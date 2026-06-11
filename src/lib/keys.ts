/** Idioms in jazz_idoms.xlsx are written in this key */
export const REFERENCE_KEY = 'B';

export const WHEEL_KEYS = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

export type WheelKey = (typeof WHEEL_KEYS)[number];

const SEMITONES_FROM_C: Record<WheelKey, number> = {
  C: 0,
  Db: 1,
  D: 2,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
};

const DISPLAY_LABELS: Record<WheelKey, string> = {
  C: 'C',
  Db: 'D♭',
  D: 'D',
  Eb: 'E♭',
  E: 'E',
  F: 'F',
  'F#': 'F♯',
  G: 'G',
  Ab: 'A♭',
  A: 'A',
  Bb: 'B♭',
  B: 'B',
};

export function keyDisplayLabel(key: WheelKey): string {
  return DISPLAY_LABELS[key];
}

/** Semitones to add so idioms sound in `key` (relative to REFERENCE_KEY). */
export function semitonesFromReference(key: WheelKey): number {
  return (SEMITONES_FROM_C[key] - SEMITONES_FROM_C[REFERENCE_KEY] + 12) % 12;
}
