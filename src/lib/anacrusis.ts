import type { Note } from '../types';
import { pickupOnsetQuarters } from './notes';
import { MEASURE_QUARTERS } from './timing';

export interface AnacrusisTimeline {
  /** Quarter-beat offset where the first sounding note enters (& of 4, etc.). */
  pickupOnsetQuarters: number;
  /** Quarter-beat offset where ii–V–I comp begins (bar 2 downbeat after pickup bar). */
  harmonicStartQuarters: number;
}

/** Leading rest length from a prepended pickup, or 0 when none. */
export function leadingPickupRestQuarters(notes: Note[]): number {
  const first = notes[0];
  if (!first?.rest) return 0;
  const match = first.duration.match(/^4n \* ([\d.]+)$/);
  if (!match) return 0;
  const leadingRest = Number(match[1]);
  return leadingRest > 0 ? leadingRest : 0;
}

/**
 * Shared grid for count-in, melody pickup, and comp.
 * Prefer explicit pickupBeat metadata; fall back to a leading pickup rest in notes.
 */
export function resolveAnacrusisTimeline(
  notes: Note[],
  pickupBeat?: number
): AnacrusisTimeline | null {
  if (pickupBeat != null && pickupBeat > 0) {
    return {
      pickupOnsetQuarters: pickupOnsetQuarters(pickupBeat),
      /** Melody pickup in bar 1; comp/bass/drums enter at bar 2 downbeat. */
      harmonicStartQuarters: MEASURE_QUARTERS,
    };
  }

  const restQuarters = leadingPickupRestQuarters(notes);
  if (restQuarters <= 0) return null;

  return {
    pickupOnsetQuarters: restQuarters,
    harmonicStartQuarters: MEASURE_QUARTERS,
  };
}
