import type { Sampler } from 'tone';
import type { WheelKey } from './keys';
import type { SwingAmount } from './playback';
import { iiViProgression } from './comp-progression';
import { chordVoicingPitches } from './comp-voicings';
import { quarterLengthSeconds } from './timing';

export interface CompHit {
  time: number;
  pitches: string[];
  duration: number;
}

/** Triplet "&" within a bar — matches pickup StartTime 3.67 (= 3 + 2/3). */
const TRIPLET_AND_OF_2 = 1 + 2 / 3;
const TRIPLET_AND_OF_4 = 3 + 2 / 3;

/** & of 2 and & of 4 within one bar (quarter-beat offsets from bar start). */
export function swungCompOffsetsInBar(swing: SwingAmount): [number, number] {
  const straight: [number, number] = [1.5, 3.5];
  const triplet: [number, number] = [TRIPLET_AND_OF_2, TRIPLET_AND_OF_4];
  if (swing <= 0) return straight;
  return [
    straight[0] + swing * (triplet[0] - straight[0]),
    straight[1] + swing * (triplet[1] - straight[1]),
  ];
}

/** Build comp hits on the absolute quarter-beat grid. */
export function buildCompHits(
  key: WheelKey,
  durationQuarters: number,
  bpm: number,
  swing: SwingAmount,
  harmonicStartQuarters = 0
): CompHit[] {
  const progression = iiViProgression(key);
  const quarter = quarterLengthSeconds(bpm);
  const hitDuration = quarter * 0.45;
  const [off1, off2] = swungCompOffsetsInBar(swing);
  const hits: CompHit[] = [];

  for (let barStart = harmonicStartQuarters; barStart < durationQuarters; barStart += 4) {
    const barIndex =
      Math.floor((barStart - harmonicStartQuarters) / 4) % progression.length;
    const pitches = chordVoicingPitches(progression[barIndex].chord);

    for (const offset of [off1, off2]) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;
      hits.push({
        time: beat * quarter,
        pitches,
        duration: hitDuration,
      });
    }
  }

  return hits;
}

export function scheduleCompHits(
  player: Sampler,
  key: WheelKey,
  bpm: number,
  swing: SwingAmount,
  startTime: number,
  durationSeconds: number,
  harmonicStartQuarters = 0,
  playbackOffsetSeconds = 0
): void {
  const quarter = quarterLengthSeconds(bpm);
  const durationQuarters = durationSeconds / quarter;
  const hits = buildCompHits(
    key,
    durationQuarters,
    bpm,
    swing,
    harmonicStartQuarters
  );

  for (const hit of hits) {
    for (const pitch of hit.pitches) {
      player.triggerAttackRelease(
        pitch,
        hit.duration,
        startTime + hit.time + playbackOffsetSeconds
      );
    }
  }
}
