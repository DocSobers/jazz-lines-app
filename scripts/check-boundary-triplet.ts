#!/usr/bin/env npx tsx
/**
 * Verify merged boundary joins use triplet feel when the prior ending
 * is longer than the incoming idiom's starting note.
 *
 * Exit 0 when all eligible pairs pass; exit 1 and list failures otherwise.
 */
import { JAZZ_IDIOMS } from '../src/data/jazz-idioms';
import {
  endPitchClass,
  flattenChain,
  hasLongerBoundaryTripletJoin,
  needsLongerBoundaryTriplet,
  startPitchClass,
} from '../src/lib/notes';
import { durationQuarters } from '../src/lib/timing';
import type { ChainItem, Example } from '../src/types';

function endNote(example: Example) {
  return example.notes.filter((note) => !note.rest).at(-1)!;
}

function startNote(example: Example) {
  return example.notes.filter((note) => !note.rest)[0]!;
}

function soundingCountAfterStrip(example: Example): number {
  const notes = example.notes.filter((note) => !note.rest);
  return Math.max(0, notes.length - 1);
}

interface Failure {
  label: string;
  reason: string;
}

const failures: Failure[] = [];
let checked = 0;
let skipped = 0;

for (const prev of JAZZ_IDIOMS) {
  for (const next of JAZZ_IDIOMS) {
    if (prev.id === next.id) continue;
    if (endPitchClass(prev) !== startPitchClass(next)) continue;

    const prevEnd = endNote(prev);
    const nextStart = startNote(next);
    if (!needsLongerBoundaryTriplet(prevEnd, nextStart)) continue;

    checked++;

    if (soundingCountAfterStrip(next) < 3) {
      skipped++;
      continue;
    }

    const chain: ChainItem[] = [
      { example: prev, octave: 0, boundaryJoin: 'merge' },
      { example: next, octave: 0, boundaryJoin: 'merge' },
    ];
    const flat = flattenChain(chain);

    if (!hasLongerBoundaryTripletJoin(flat, prevEnd)) {
      const prevQ = durationQuarters(prevEnd.duration);
      const nextQ = durationQuarters(nextStart.duration);
      failures.push({
        label: `${prev.label} → ${next.label}`,
        reason: `${prevEnd.pitch} ${prevEnd.duration} (${prevQ}) > ${nextStart.pitch} ${nextStart.duration} (${nextQ}) — no joinTriplet at boundary`,
      });
    }
  }
}

console.log(`Checked ${checked} longer-boundary pairs (${skipped} skipped: <3 notes after strip).`);

if (failures.length === 0) {
  console.log('OK — all eligible joins use triplet feel at the boundary.');
  process.exit(0);
}

console.error(`FAIL — ${failures.length} pair(s) missing boundary triplet:\n`);
for (const failure of failures.slice(0, 20)) {
  console.error(`  • ${failure.label}: ${failure.reason}`);
}
if (failures.length > 20) {
  console.error(`  … and ${failures.length - 20} more`);
}
process.exit(1);
