import type { ChainItem } from '../types';
import { resolveAnacrusisTimeline } from './anacrusis';
import { iiViProgression, type ChordSymbol } from './comp-progression';
import type { WheelKey } from './keys';
import {
  type LineEndingGrid,
  COMP_FERMATA_HOLD_QUARTERS,
  resolveLineEnding,
  STANDARD_FINAL_BAR_START_QUARTERS,
  STANDARD_MELODY_END_QUARTERS,
} from './line-ending';
import { flattenChain } from './notes';
import { MEASURE_QUARTERS } from './timing';

export type { LineEndingGrid } from './line-ending';
export {
  COMP_FERMATA_HOLD_QUARTERS,
  resolveLineEnding,
  applyLineEndingNotes,
  STANDARD_FINAL_BAR_START_QUARTERS,
  STANDARD_MELODY_END_QUARTERS,
} from './line-ending';

export interface HarmonySegment {
  startQuarter: number;
  endQuarter: number;
  chord: ChordSymbol;
}

export interface HarmonyTimeline {
  harmonicStartQuarters: number;
  segments: HarmonySegment[];
  ending: LineEndingGrid;
}

type SectionRole = 'ii' | 'V' | 'I';

function roleToChord(role: SectionRole, key: WheelKey): ChordSymbol {
  const progression = iiViProgression(key);
  switch (role) {
    case 'ii':
      return progression[0].chord;
    case 'V':
      return progression[1].chord;
    case 'I':
      return progression[2].chord;
  }
}

function buildStrictBackingSegments(
  key: WheelKey,
  harmonicStartQuarters: number,
  ending: LineEndingGrid
): HarmonySegment[] {
  const segments: HarmonySegment[] = [];
  let cursor = harmonicStartQuarters;

  const append = (role: SectionRole, endQuarter: number) => {
    if (cursor >= endQuarter || cursor >= ending.melodyEndQuarters) return;
    const end = Math.min(endQuarter, ending.melodyEndQuarters);
    segments.push({
      startQuarter: cursor,
      endQuarter: end,
      chord: roleToChord(role, key),
    });
    cursor = end;
  };

  append('ii', cursor + MEASURE_QUARTERS);
  append('V', cursor + MEASURE_QUARTERS);

  if (cursor < ending.finalBarStartQuarters) {
    segments.push({
      startQuarter: cursor,
      endQuarter: ending.finalBarStartQuarters,
      chord: roleToChord('I', key),
    });
    cursor = ending.finalBarStartQuarters;
  }

  append('I', ending.melodyEndQuarters);

  return segments;
}

export function buildHarmonyTimeline(
  chain: ChainItem[],
  key: WheelKey,
  pickupBeat?: number
): HarmonyTimeline {
  const flatNotes = flattenChain(chain);
  const anacrusis = resolveAnacrusisTimeline(flatNotes, pickupBeat);
  const harmonicStartQuarters = anacrusis?.harmonicStartQuarters ?? 0;
  const ending = resolveLineEnding(flatNotes, pickupBeat);

  return {
    harmonicStartQuarters,
    ending,
    segments: buildStrictBackingSegments(key, harmonicStartQuarters, ending),
  };
}

/** @deprecated Use timeline.ending.melodyEndQuarters */
export function backingFormEndQuarters(): number {
  return STANDARD_MELODY_END_QUARTERS;
}

/** @deprecated Use timeline.ending.compEndQuarters */
export function compBackingEndQuarters(): number {
  return STANDARD_FINAL_BAR_START_QUARTERS + COMP_FERMATA_HOLD_QUARTERS;
}

export function chordAtQuarter(
  timeline: HarmonyTimeline,
  quarter: number
): ChordSymbol | null {
  if (quarter < timeline.harmonicStartQuarters) return null;
  if (quarter >= timeline.ending.melodyEndQuarters) return null;

  for (const segment of timeline.segments) {
    if (quarter >= segment.startQuarter && quarter < segment.endQuarter) {
      return segment.chord;
    }
  }

  return null;
}
