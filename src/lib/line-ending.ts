import type { Note } from '../types';
import {
  extendLastNoteToQuarter,
  lastSoundingNoteOnsetQuarters,
  notesDurationQuarters,
} from './notes';
import { MEASURE_QUARTERS } from './timing';

/** Sustained I comp from resolution-bar beat 1 for three quarter beats. */
export const COMP_FERMATA_HOLD_QUARTERS = 3;

/** Standard 4-bar line: resolution on bar 4 (quarters 12–16). */
export const STANDARD_FINAL_BAR_START_QUARTERS = 3 * MEASURE_QUARTERS;
export const STANDARD_MELODY_END_QUARTERS = 4 * MEASURE_QUARTERS;

export interface LineEndingGrid {
  /** Beat 1 of the resolution bar — comp fermata downbeat. */
  finalBarStartQuarters: number;
  /** End of resolution bar (exclusive) — full-bar melody hold. */
  melodyEndQuarters: number;
  /** Comp/bass stop after three beats on the resolution bar. */
  compEndQuarters: number;
}

/**
 * Standard line ending: comp fermata on beat 1 of the resolution bar (3-beat hold),
 * melody last note through the full resolution bar.
 */
export function resolveLineEnding(notes: Note[], pickupBeat?: number): LineEndingGrid {
  const naturalEnd = notesDurationQuarters(notes);

  if (
    (pickupBeat != null && pickupBeat > 0) ||
    naturalEnd <= STANDARD_MELODY_END_QUARTERS + 1e-9
  ) {
    return {
      finalBarStartQuarters: STANDARD_FINAL_BAR_START_QUARTERS,
      melodyEndQuarters: STANDARD_MELODY_END_QUARTERS,
      compEndQuarters:
        STANDARD_FINAL_BAR_START_QUARTERS + COMP_FERMATA_HOLD_QUARTERS,
    };
  }

  const lastOnset = lastSoundingNoteOnsetQuarters(notes) ?? naturalEnd;
  const finalBarStart = Math.floor(lastOnset / MEASURE_QUARTERS) * MEASURE_QUARTERS;
  return {
    finalBarStartQuarters: finalBarStart,
    melodyEndQuarters: finalBarStart + MEASURE_QUARTERS,
    compEndQuarters: finalBarStart + COMP_FERMATA_HOLD_QUARTERS,
  };
}

/** Extend the last note through the resolution bar and mark a fermata. */
export function applyLineEndingNotes(notes: Note[], pickupBeat?: number): Note[] {
  if (notes.length === 0) return notes;
  const ending = resolveLineEnding(notes, pickupBeat);
  return extendLastNoteToQuarter(notes, ending.melodyEndQuarters);
}
