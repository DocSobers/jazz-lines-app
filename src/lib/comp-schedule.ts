import type { Sampler } from 'tone';
import type { SwingAmount } from './playback';
import { chordVoicingPitches } from './comp-voicings';
import {
  chordAtQuarter,
  COMP_FERMATA_HOLD_QUARTERS,
  type HarmonyTimeline,
} from './harmony-timeline';
import { MEASURE_QUARTERS, quarterLengthSeconds } from './timing';

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

/** Build comp hits on the absolute quarter-beat grid using the harmony timeline. */
export function buildCompHits(
  timeline: HarmonyTimeline,
  durationQuarters: number,
  bpm: number,
  swing: SwingAmount
): CompHit[] {
  const quarter = quarterLengthSeconds(bpm);
  const hitDuration = quarter * 0.45;
  const [off1, off2] = swungCompOffsetsInBar(swing);
  const hits: CompHit[] = [];
  const harmonicStart = timeline.harmonicStartQuarters;
  const { finalBarStartQuarters } = timeline.ending;

  for (let barStart = harmonicStart; barStart < durationQuarters; barStart += MEASURE_QUARTERS) {
    if (barStart >= finalBarStartQuarters) break;

    for (const offset of [off1, off2]) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;

      const chord = chordAtQuarter(timeline, beat);
      if (!chord) continue;

      hits.push({
        time: beat * quarter,
        pitches: chordVoicingPitches(chord),
        duration: hitDuration,
      });
    }
  }

  const fermataChord = chordAtQuarter(timeline, finalBarStartQuarters);
  if (fermataChord && durationQuarters > finalBarStartQuarters) {
    hits.push({
      time: finalBarStartQuarters * quarter,
      pitches: chordVoicingPitches(fermataChord),
      duration: COMP_FERMATA_HOLD_QUARTERS * quarter,
    });
  }

  return hits;
}

export function scheduleCompHits(
  player: Sampler,
  timeline: HarmonyTimeline,
  bpm: number,
  swing: SwingAmount,
  startTime: number,
  durationSeconds: number,
  playbackOffsetSeconds = 0
): void {
  const quarter = quarterLengthSeconds(bpm);
  const durationQuarters = durationSeconds / quarter;
  const hits = buildCompHits(timeline, durationQuarters, bpm, swing);

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
