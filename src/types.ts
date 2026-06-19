export interface Note {
  /** Scientific pitch notation, e.g. "G4", "Bb3" */
  pitch: string;
  /** Tone.js duration: "8n", "4n", "16n", "2n", etc. */
  duration: string;
  /** Rest — advance time without sounding a pitch */
  rest?: boolean;
  /** Bar-4 fermata hold when the line is extended to the backing cutoff */
  fermata?: boolean;
  /** Join triplet: first three sounding notes of incoming idiom at a merged boundary. */
  joinTriplet?: boolean;
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

/** Whether the next idiom auto-aligns octave to the prior ending note at a shared pitch. */
export type RegisterJoin = 'align' | 'asWritten';

/** Book rhythm vs demo swung copy (only for idioms with a curated variant, e.g. V–I #1a). */
export type LineRhythm = 'book' | 'demoSwung';

/** Cross-bar triplet stitch at a shared boundary (Align + Once). */
export type JoinRhythm = 'asWritten' | 'tripletCrossBar';

/** @deprecated Use `joinRhythm` / `lineRhythm` on ChainItem. */
export type EntryRhythm = 'asWritten' | 'triplet';

export interface ChainItem {
  example: Example;
  /** Whole-octave shift applied to this idiom in the line */
  octave: number;
  /** How this idiom connects to the previous one when boundary pitch classes match */
  boundaryJoin?: BoundaryJoin;
  /** Keep written register at join; shared boundary notes sound in each idiom's octave (no Once drop). */
  registerJoin?: RegisterJoin;
  /** Book vs demo swung notes (V–I #1a only). */
  lineRhythm?: LineRhythm;
  /** Triplet cross-bar join at shared pitch (Align + Once). */
  joinRhythm?: JoinRhythm;
  /** @deprecated Use `joinRhythm` and `lineRhythm`. */
  entryRhythm?: EntryRhythm;
  /** Quarter-beat entry shift when chaining: positive = earlier, negative = later (pad). */
  beatOffset?: number;
}

export interface JoinedLine {
  examples: Example[];
  /** Flattened notes with boundary duplicates removed */
  notes: Note[];
}
