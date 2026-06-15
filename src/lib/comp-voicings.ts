import type { ChordQuality, ChordSymbol } from './comp-progression';
import { pitchClass } from './notes';

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

/** Rootless voicing intervals (semitones above root). */
const VOICING_INTERVALS: Record<ChordQuality, number[]> = {
  m7: [3, 7, 10, 14],
  7: [4, 10, 14],
  maj7: [4, 7, 11, 14],
};

function pitchFromSemitone(semitone: number, baseOctave: number): string {
  const octave = baseOctave + Math.floor(semitone / 12);
  const pc = SEMITONE_PITCH_CLASS[((semitone % 12) + 12) % 12];
  return `${pc}${octave}`;
}

/** Mid-register rootless voicing for comping (e.g. Dm7 → F3 A3 C4 E4). */
export function chordVoicingPitches(chord: ChordSymbol, baseOctave = 3): string[] {
  const root = PITCH_CLASS_SEMITONE[pitchClass(chord.root)] ?? 0;
  const rootSemi = root + baseOctave * 12;
  return VOICING_INTERVALS[chord.quality].map((interval) =>
    pitchFromSemitone(rootSemi + interval, 0)
  );
}

/** Low root for upright bass (e.g. Dm7 → D2). */
export function chordRootPitch(chord: ChordSymbol, octave = 2): string {
  return `${pitchClass(chord.root)}${octave}`;
}

/** Perfect fifth above the root for bass beat 3 (e.g. Dm7 → A2). */
export function chordFifthPitch(chord: ChordSymbol, octave = 2): string {
  const root = PITCH_CLASS_SEMITONE[pitchClass(chord.root)] ?? 0;
  const rootSemi = root + octave * 12;
  return pitchFromSemitone(rootSemi + 7, 0);
}
