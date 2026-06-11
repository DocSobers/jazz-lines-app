import type { ChainItem, Example, Note } from '../types';

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

function joinOctaveOffset(flattenedSoFar: Note[], next: Example): number {
  const prevEnd = soundingNotes(flattenedSoFar).at(-1);
  const nextStart = soundingNotes(next.notes)[0];
  if (!prevEnd || !nextStart) return 0;
  return pitchOctave(prevEnd.pitch) - pitchOctave(nextStart.pitch);
}

/** Leading rest so a pickup lands on the correct beat (e.g. "and" of 4). */
export function prependPickup(notes: Note[], pickupBeat?: number): Note[] {
  if (!pickupBeat || pickupBeat <= 0) return notes;
  return [
    { rest: true, pitch: 'R', duration: `4n * ${pickupBeat}` },
    ...notes,
  ];
}

/** Merge chain items; per-item octave overrides auto-alignment for that idiom. */
export function flattenChain(items: ChainItem[]): Note[] {
  if (items.length === 0) return [];

  const first = items[0];
  const result: Note[] = [
    ...transposeNotes(
      prependPickup(first.example.notes, first.example.pickupBeat),
      first.octave
    ),
  ];

  for (let i = 1; i < items.length; i++) {
    const curr = items[i];
    const prevSounding = soundingNotes(items[i - 1].example.notes);
    const currSounding = soundingNotes(curr.example.notes);
    const sharesBoundary =
      pitchClass(prevSounding[prevSounding.length - 1].pitch) ===
      pitchClass(currSounding[0].pitch);

    if (sharesBoundary && result.length > 0) {
      result.pop();
    }

    const notesToAdd =
      curr.octave !== 0
        ? transposeNotes(curr.example.notes, curr.octave)
        : transposeNotes(curr.example.notes, joinOctaveOffset(result, curr.example));

    result.push(...notesToAdd);
  }

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
