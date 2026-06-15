export interface Note {
  /** Scientific pitch notation, e.g. "G4", "Bb3" */
  pitch: string;
  /** Tone.js duration: "8n", "4n", "16n", "2n", etc. */
  duration: string;
  /** Rest — advance time without sounding a pitch */
  rest?: boolean;
}

export interface Example {
  id: string;
  /** Section label, e.g. "II-V" or a book page */
  section: string;
  /** Example number as printed in the source */
  number: string;
  label: string;
  notes: Note[];
  /** Quarter-note beat offset before first note (pickup on "and" of 4, etc.) */
  pickupBeat?: number;
}

export type BoundaryJoin = 'merge' | 'restate';

export interface ChainItem {
  example: Example;
  /** Whole-octave shift applied to this idiom in the line */
  octave: number;
  /** How this idiom connects to the previous one when boundary pitch classes match */
  boundaryJoin?: BoundaryJoin;
}

export interface JoinedLine {
  examples: Example[];
  /** Flattened notes with boundary duplicates removed */
  notes: Note[];
}
