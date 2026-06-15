import type { Sampler } from 'tone';
import type { WheelKey } from './keys';
import type { SwingAmount } from './playback';
import { iiViProgression } from './comp-progression';
import { chordVoicingPitches } from './comp-voicings';

export interface CompHit {
  time: number;
  pitches: string[];
  duration: number;
}

/** & of 2 and & of 4 within one bar (quarter-beat offsets from bar start). */
function swungCompOffsetsInBar(swing: SwingAmount): [number, number] {
  const push = 0.25 * swing;
  return [1.5 + push, 3.5 + push];
}

/** Build comp hits for a duration in quarter-note beats. */
export function buildCompHits(
  key: WheelKey,
  durationQuarters: number,
  bpm: number,
  swing: SwingAmount
): CompHit[] {
  const progression = iiViProgression(key);
  const quarter = 60 / bpm;
  const hitDuration = quarter * 0.45;
  const [off1, off2] = swungCompOffsetsInBar(swing);
  const hits: CompHit[] = [];

  for (let barStart = 0; barStart < durationQuarters; barStart += 4) {
    const barIndex = Math.floor(barStart / 4) % progression.length;
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
  harmonicStartQuarters = 0
): void {
  const quarter = 60 / bpm;
  const durationQuarters = durationSeconds / quarter;
  const compDurationQuarters = Math.max(0, durationQuarters - harmonicStartQuarters);
  const hits = buildCompHits(key, compDurationQuarters, bpm, swing);
  const harmonicStartSeconds = harmonicStartQuarters * quarter;
  for (const hit of hits) {
    for (const pitch of hit.pitches) {
      player.triggerAttackRelease(
        pitch,
        hit.duration,
        startTime + harmonicStartSeconds + hit.time
      );
    }
  }
}
