import * as Tone from 'tone';

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
