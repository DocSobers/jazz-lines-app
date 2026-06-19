import type { ChainItem, Example, Note } from '../types';
import { durationQuarters } from './timing';

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
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/** Strip octave to get pitch class, e.g. "G4" -> "G", "Bb3" -> "Bb" */
export function pitchClass(pitch: string): string {
  return pitch.replace(/-?\d+$/, '');
}

function soundingNotes(notes: Note[]): Note[] {
  return notes.filter((n) => !n.rest);
}

export function startPitchClass(example: Example): string {
  const notes = soundingNotes(example.notes);
  return pitchClass(notes[0].pitch);
}

export function endPitchClass(example: Example): string {
  const notes = soundingNotes(example.notes);
  return pitchClass(notes[notes.length - 1].pitch);
}

export function canJoin(previous: Example, next: Example): boolean {
  return endPitchClass(previous) === startPitchClass(next);
}

function pitchOctave(pitch: string): number {
  const match = pitch.match(/(\d+)$/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);
  return Number(match[1]);
}

function pitchToMidi(pitch: string): number {
  const pc = pitchClass(pitch);
  const semitone = PITCH_CLASS_SEMITONE[pc];
  if (semitone === undefined) throw new Error(`Unknown pitch class: ${pc}`);
  return (pitchOctave(pitch) + 1) * 12 + semitone;
}

function midiToPitch(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  return `${SEMITONE_PITCH_CLASS[semitone]}${octave}`;
}

export function transposePitch(pitch: string, semitones: number): string {
  if (semitones === 0) return pitch;
  return midiToPitch(pitchToMidi(pitch) + semitones);
}

/** Shift all notes by semitones (chromatic transposition). */
export function transposeNotesBySemitones(notes: Note[], semitones: number): Note[] {
  if (semitones === 0) return notes;
  return notes.map((note) => {
    if (note.rest) return note;
    return { ...note, pitch: transposePitch(note.pitch, semitones) };
  });
}

export function transposeExample(example: Example, semitones: number): Example {
  if (semitones === 0) return example;
  return {
    ...example,
    notes: transposeNotesBySemitones(example.notes, semitones),
  };
}

/** Shift all notes by whole octaves so the next phrase continues in the previous ending octave. */
export function transposeNotes(notes: Note[], octaveOffset: number): Note[] {
  if (octaveOffset === 0) return notes;
  return notes.map((note) => {
    if (note.rest) return note;
    const octave = pitchOctave(note.pitch);
    return {
      ...note,
      pitch: note.pitch.replace(/\d+$/, String(octave + octaveOffset)),
    };
  });
}

function autoJoinOctaveOffset(
  item: ChainItem,
  flattenedSoFar: Note[],
  next: Example,
  boundaryEnd?: Note
): number {
  if (item.registerJoin === 'asWritten') return 0;
  return joinOctaveOffset(flattenedSoFar, next, boundaryEnd);
}

function joinOctaveOffset(
  flattenedSoFar: Note[],
  next: Example,
  boundaryEnd?: Note
): number {
  const prevEnd =
    boundaryEnd && !boundaryEnd.rest
      ? boundaryEnd
      : soundingNotes(flattenedSoFar).at(-1);
  const nextStart = soundingNotes(next.notes)[0];
  if (!prevEnd || !nextStart) return 0;
  return pitchOctave(prevEnd.pitch) - pitchOctave(nextStart.pitch);
}

/**
 * Spreadsheet StartTime (e.g. 3.67) is quarter beats from bar 1 to the first note.
 * For & of beat 4 with triplet pickup (8t), that is beat 4 + two triplet eighths (3 + 2/3).
 */
export function pickupOnsetQuarters(pickupBeat: number): number {
  return pickupBeat;
}

/** Leading rest so a pickup lands on the correct beat (e.g. "&" of 4). */
export function prependPickup(notes: Note[], pickupBeat?: number): Note[] {
  if (!pickupBeat || pickupBeat <= 0) return notes;
  return [
    { rest: true, pitch: 'R', duration: `4n * ${pickupBeat}` },
    ...notes,
  ];
}

function quartersToDuration(quarters: number): string {
  if (quarters === 0.5) return '8n';
  if (quarters === 1) return '4n';
  if (quarters === 2) return '2n';
  if (quarters === 0.25) return '16n';
  if (quarters === 1 / 3) return '8t';
  if (quarters === 2 / 3) return '4t';
  return `4n * ${quarters}`;
}

/** Remove quarter-beat duration from the end of a note list (for earlier chain entry). */
export function trimTailQuarters(notes: Note[], quartersToTrim: number): Note[] {
  if (quartersToTrim <= 0) return notes;

  const result = [...notes];
  let remaining = quartersToTrim;

  while (remaining > 0 && result.length > 0) {
    const last = result[result.length - 1];
    const dur = durationQuarters(last.duration);
    if (dur == null) break;

    if (dur <= remaining + 1e-9) {
      remaining -= dur;
      result.pop();
      continue;
    }

    result[result.length - 1] = {
      ...last,
      duration: quartersToDuration(dur - remaining),
    };
    remaining = 0;
  }

  return result;
}

/** Total quarter beats of leading rests before the first sounding note. */
export function leadingRestQuarters(notes: Note[]): number {
  let total = 0;
  for (const note of notes) {
    if (!note.rest) break;
    const quarters = durationQuarters(note.duration);
    if (quarters == null) break;
    total += quarters;
  }
  return total;
}

/** Shift a chained idiom earlier: strip its pickup rests first, then trim the prior tail. */
export function applyEarlierEntry(
  flattenedSoFar: Note[],
  notesToAdd: Note[],
  quartersEarlier: number
): { flattenedSoFar: Note[]; notesToAdd: Note[] } {
  if (quartersEarlier <= 0) {
    return { flattenedSoFar, notesToAdd };
  }

  const stripFromPickup = Math.min(quartersEarlier, leadingRestQuarters(notesToAdd));
  const trimmedNotes =
    stripFromPickup > 0
      ? stripLeadingRestQuarters(notesToAdd, stripFromPickup)
      : notesToAdd;
  const trimFromTail = quartersEarlier - stripFromPickup;
  const trimmedFlattened =
    trimFromTail > 0 ? trimTailQuarters(flattenedSoFar, trimFromTail) : flattenedSoFar;

  return {
    flattenedSoFar: trimmedFlattened,
    notesToAdd: trimmedNotes,
  };
}

/** Pad before a chained idiom so it enters later than the sequential join point. */
export function prependEntryDelay(notes: Note[], quartersLater: number): Note[] {
  if (quartersLater <= 0) return notes;
  return [
    { rest: true, pitch: 'R', duration: quartersToDuration(quartersLater) },
    ...notes,
  ];
}
/** Drop leading rests up to a quarter-beat budget (pairs with trimTailQuarters). */
export function stripLeadingRestQuarters(notes: Note[], quartersToStrip: number): Note[] {
  if (quartersToStrip <= 0) return notes;

  const result = [...notes];
  let remaining = quartersToStrip;

  while (remaining > 0 && result.length > 0) {
    const first = result[0];
    if (!first.rest) break;

    const dur = durationQuarters(first.duration);
    if (dur == null) break;

    if (dur <= remaining + 1e-9) {
      remaining -= dur;
      result.shift();
      continue;
    }

    result[0] = {
      ...first,
      duration: quartersToDuration(dur - remaining),
    };
    remaining = 0;
  }

  return result;
}

export interface ChainSegment {
  section: string;
  notes: Note[];
}

/** At an aligned join, match the next idiom's first note length to the prior ending when shorter. */
function matchBoundaryEntryDuration(notesToAdd: Note[], prevEnding: Note): Note[] {
  const firstIdx = notesToAdd.findIndex((note) => !note.rest);
  if (firstIdx < 0) return notesToAdd;

  const prevQuarters = durationQuarters(prevEnding.duration);
  const firstQuarters = durationQuarters(notesToAdd[firstIdx].duration);
  if (prevQuarters == null || firstQuarters == null || prevQuarters > firstQuarters) {
    return notesToAdd;
  }

  const result = [...notesToAdd];
  result[firstIdx] = { ...result[firstIdx], duration: prevEnding.duration };
  return result;
}

/** Per-idiom note spans after join/octave/entry rules (same logic as flattenChain). */
export function buildChainSegments(items: ChainItem[]): ChainSegment[] {
  if (items.length === 0) return [];

  const segments: ChainSegment[] = [];
  const first = items[0];
  const firstNotes = transposeNotes(
    prependPickup(first.example.notes, first.example.pickupBeat),
    first.octave
  );
  segments.push({ section: first.example.section, notes: firstNotes });
  let result: Note[] = [...firstNotes];

  for (let i = 1; i < items.length; i++) {
    const curr = items[i];
    const prevSounding = soundingNotes(items[i - 1].example.notes);
    const currSounding = soundingNotes(curr.example.notes);
    const sharesBoundary =
      pitchClass(prevSounding[prevSounding.length - 1].pitch) ===
      pitchClass(currSounding[0].pitch);

    const mergeBoundary =
      (curr.boundaryJoin ?? 'merge') === 'merge' &&
      (curr.registerJoin ?? 'align') !== 'asWritten';

    let boundaryNote: Note | undefined;
    if (sharesBoundary && mergeBoundary && result.length > 0) {
      boundaryNote = result.pop();
      const lastSeg = segments[segments.length - 1];
      lastSeg.notes = lastSeg.notes.slice(0, -1);
    }

    let notesToAdd = transposeNotes(
      curr.example.notes,
      autoJoinOctaveOffset(curr, result, curr.example, boundaryNote)
    );
    if (curr.octave !== 0) {
      notesToAdd = transposeNotes(notesToAdd, curr.octave);
    }

    if (
      curr.example.section === 'V-I' &&
      (curr.registerJoin ?? 'align') === 'align'
    ) {
      const leading = leadingRestQuarters(notesToAdd);
      if (leading > 0) {
        notesToAdd = stripLeadingRestQuarters(notesToAdd, leading);
      }
    }

    if (
      sharesBoundary &&
      (curr.registerJoin ?? 'align') === 'align' &&
      (curr.entryRhythm ?? 'asWritten') === 'triplet'
    ) {
      const prevEnding = soundingNotes(items[i - 1].example.notes).at(-1);
      if (prevEnding) {
        notesToAdd = matchBoundaryEntryDuration(notesToAdd, prevEnding);
      }
    }

    const entryOffset = curr.beatOffset ?? 0;
    if (entryOffset > 0) {
      const adjusted = applyEarlierEntry(result, notesToAdd, entryOffset);
      result.splice(0, result.length, ...adjusted.flattenedSoFar);
      const lastSeg = segments[segments.length - 1];
      lastSeg.notes = trimTailQuarters(lastSeg.notes, entryOffset);
      notesToAdd = adjusted.notesToAdd;
    } else if (entryOffset < 0) {
      notesToAdd = prependEntryDelay(notesToAdd, Math.abs(entryOffset));
    }

    segments.push({ section: curr.example.section, notes: notesToAdd });
    result.push(...notesToAdd);
  }

  return segments;
}

export function notesDurationQuarters(notes: Note[]): number {
  let total = 0;
  for (const note of notes) {
    const quarters = durationQuarters(note.duration);
    if (quarters != null) total += quarters;
  }
  return total;
}

/** Quarter-beat position where the last sounding note begins. */
export function lastSoundingNoteOnsetQuarters(notes: Note[]): number | null {
  let time = 0;
  let lastOnset: number | null = null;
  for (const note of notes) {
    if (!note.rest) lastOnset = time;
    const quarters = durationQuarters(note.duration);
    if (quarters == null) break;
    time += quarters;
  }
  return lastOnset;
}

/** Merge chain items; per-item octave overrides auto-alignment for that idiom. */
export function flattenChain(items: ChainItem[]): Note[] {
  return buildChainSegments(items).flatMap((segment) => segment.notes);
}

/** Hold the last sounding note until a target grid quarter (e.g. end of backing form). */
export function extendLastNoteToQuarter(notes: Note[], endQuarter: number): Note[] {
  if (notes.length === 0) return notes;

  let lastSoundingIdx = -1;
  for (let i = notes.length - 1; i >= 0; i--) {
    if (!notes[i].rest) {
      lastSoundingIdx = i;
      break;
    }
  }
  if (lastSoundingIdx < 0) return notes;

  let onset = 0;
  for (let i = 0; i < lastSoundingIdx; i++) {
    const quarters = durationQuarters(notes[i].duration);
    if (quarters == null) return notes;
    onset += quarters;
  }

  const holdQuarters = endQuarter - onset;
  if (holdQuarters <= 0) return notes;

  const currentQuarters = durationQuarters(notes[lastSoundingIdx].duration);
  if (currentQuarters != null && holdQuarters <= currentQuarters + 1e-9) {
    return notes;
  }

  const result = [...notes];
  result[lastSoundingIdx] = {
    ...result[lastSoundingIdx],
    duration: quartersToDuration(holdQuarters),
    fermata: true,
  };
  return result;
}

export function formatPitchClass(pc: string): string {
  const map: Record<string, string> = {
    'C#': 'C♯',
    'D#': 'D♯',
    'F#': 'F♯',
    'G#': 'G♯',
    'A#': 'A♯',
    Db: 'D♭',
    Eb: 'E♭',
    Gb: 'G♭',
    Ab: 'A♭',
    Bb: 'B♭',
  };
  return map[pc] ?? pc;
}
