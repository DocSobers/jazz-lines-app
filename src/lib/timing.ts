import * as Tone from 'tone';
import type { Note } from '../types';

/** One quarter-note beat in seconds at the given tempo (Tone transport grid). */
export function quarterLengthSeconds(bpm: number): number {
  Tone.getTransport().bpm.value = bpm;
  return Tone.Time('4n').toSeconds();
}

export const MEASURE_QUARTERS = 4;

/** Written durations in quarter-note beats (matches notation / spreadsheet). */
const DURATION_QUARTERS: Record<string, number> = {
  '8t': 1 / 3,
  '4t': 2 / 3,
  '8n': 0.5,
  '4n': 1,
  '16n': 0.25,
  '2n': 2,
  '4n * 0.11': 0.11,
  '4n * 0.25': 0.25,
  '4n * 0.3': 0.3,
};

/** Quarter-beat length for app duration strings; null when unknown. */
export function durationQuarters(duration: string): number | null {
  if (duration in DURATION_QUARTERS) {
    return DURATION_QUARTERS[duration];
  }
  const match = duration.match(/^4n \* ([\d.]+)$/);
  if (match) return Number(match[1]);
  return null;
}

/**
 * Seconds for a written duration at tempo.
 * Pickup rests (4n * N) use exact quarter math so they match the count-in grid.
 */
export function durationSeconds(duration: string, bpm: number): number {
  const quarters = durationQuarters(duration);
  if (quarters != null) {
    return quarters * quarterLengthSeconds(bpm);
  }
  Tone.getTransport().bpm.value = bpm;
  return Tone.Time(duration).toSeconds();
}

/** Jazz swung beat: 8t+8t on the page, or explicit 4t+8t / 8t+4t long–short pairs. */
export function isSwungBeatPair(aDuration: string, bDuration: string): boolean {
  const key = `${aDuration}+${bDuration}`;
  return key === '4t+8t' || key === '8t+4t' || key === '8t+8t';
}

/**
 * Performed lengths as fractions of one quarter beat.
 * Swing 0 → straight 50/50; swing 1 → triplet long–short (2/3 + 1/3 or reverse).
 * Written 8t+8t pairs always play long then short (1st + 3rd triplet partials).
 */
export function swungBeatFractions(
  aDuration: string,
  bDuration: string,
  swing: number
): [number, number] {
  const long = 0.5 + swing * (2 / 3 - 0.5);
  const short = 0.5 + swing * (1 / 3 - 0.5);
  if (aDuration === '4t' && bDuration === '8t') return [long, short];
  if (aDuration === '8t' && bDuration === '8t') return [long, short];
  if (aDuration === '8t' && bDuration === '4t') return [short, long];
  return [long, short];
}

/** Performed span in quarter beats (swing pairs, join triplets, etc.). */
export function performedDurationQuarters(notes: Note[], swing = 1): number {
  let time = 0;
  let i = 0;

  while (i < notes.length) {
    const a = notes[i];
    const b = notes[i + 1];
    const c = notes[i + 2];

    if (
      a &&
      b &&
      c &&
      !a.rest &&
      !b.rest &&
      !c.rest &&
      a.joinTriplet &&
      b.joinTriplet &&
      c.joinTriplet
    ) {
      time +=
        (durationQuarters(a.duration) ?? 0) +
        (durationQuarters(b.duration) ?? 0) +
        (durationQuarters(c.duration) ?? 0);
      i += 3;
      continue;
    }

    if (
      swing > 0 &&
      b &&
      !a.rest &&
      !b.rest &&
      isSwungBeatPair(a.duration, b.duration)
    ) {
      time += 1;
      i += 2;
      continue;
    }

    if (
      a &&
      b &&
      c &&
      !a.rest &&
      !b.rest &&
      !c.rest &&
      a.duration === '8t' &&
      b.duration === '8t' &&
      c.duration === '8t' &&
      !a.joinTriplet &&
      !b.joinTriplet &&
      !c.joinTriplet
    ) {
      time += 1;
      i += 3;
      continue;
    }

    time += durationQuarters(a.duration) ?? 0;
    i += 1;
  }

  return time;
}
