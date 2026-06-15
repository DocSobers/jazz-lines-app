import { semitonesFromReference, type WheelKey } from './keys';
import { pitchClass } from './notes';

export type ChordQuality = 'm7' | '7' | 'maj7';

export interface ChordSymbol {
  root: string;
  quality: ChordQuality;
}

export interface ProgressionBar {
  chord: ChordSymbol;
  beats: number;
}

const PITCH_CLASS_SEMITONE: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const SEMITONE_PITCH_CLASS = [
  'C',
  'C#',
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

/** Fixed 4-bar ii–V–I in concert C (transposed to the line key). */
const II_V_I_IN_C: ProgressionBar[] = [
  { chord: { root: 'D', quality: 'm7' }, beats: 4 },
  { chord: { root: 'G', quality: '7' }, beats: 4 },
  { chord: { root: 'C', quality: 'maj7' }, beats: 4 },
  { chord: { root: 'C', quality: 'maj7' }, beats: 4 },
];

function transposeRoot(root: string, semitones: number): string {
  const pc = pitchClass(root);
  const from = PITCH_CLASS_SEMITONE[pc];
  if (from === undefined) return root;
  return SEMITONE_PITCH_CLASS[(from + semitones + 12) % 12];
}

function transposeBar(bar: ProgressionBar, semitones: number): ProgressionBar {
  return {
    ...bar,
    chord: {
      ...bar.chord,
      root: transposeRoot(bar.chord.root, semitones),
    },
  };
}

/** Four-bar ii–V–I loop in the selected key wheel key. */
export function iiViProgression(key: WheelKey): ProgressionBar[] {
  const semitones = semitonesFromReference(key);
  return II_V_I_IN_C.map((bar) => transposeBar(bar, semitones));
}

/** Display label for a chord symbol, e.g. "Dm7", "G7", "Cmaj7". */
export function chordLabel(chord: ChordSymbol): string {
  switch (chord.quality) {
    case 'm7':
      return `${chord.root}m7`;
    case '7':
      return `${chord.root}7`;
    case 'maj7':
      return `${chord.root}maj7`;
  }
}

/** Human-readable progression for the current key, e.g. "Dm7 | G7 | Cmaj7 | Cmaj7". */
export function iiViProgressionLabel(key: WheelKey): string {
  return iiViProgression(key).map((bar) => chordLabel(bar.chord)).join(' | ');
}
