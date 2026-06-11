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
}

export interface JoinedLine {
  examples: Example[];
  /** Flattened notes with boundary duplicates removed */
  notes: Note[];
}
