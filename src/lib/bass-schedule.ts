import type { Sampler } from 'tone';
import { chordFifthPitch, chordRootPitch } from './comp-voicings';
import {
  chordAtQuarter,
  COMP_FERMATA_HOLD_QUARTERS,
  type HarmonyTimeline,
} from './harmony-timeline';
import { MEASURE_QUARTERS, quarterLengthSeconds } from './timing';

export interface BassHit {
  time: number;
  pitch: string;
  duration: number;
  velocity: number;
}

/** Beats 1 and 3 within a bar (quarter-beat offsets from bar start). */
export const BASS_BEAT_OFFSETS = [0, 2] as const;

/** Fingered jazz pizz — root rings through beat 2; fifth sings on beat 3. */
const BASS_VELOCITY: Record<(typeof BASS_BEAT_OFFSETS)[number], number> = {
  0: 0.76,
  2: 0.7,
};

function bassHitDuration(offset: (typeof BASS_BEAT_OFFSETS)[number], quarter: number): number {
  return offset === 0 ? quarter * 1.85 : quarter * 1.75;
}

/** Build bass hits: root on beat 1, fifth on beat 3 (section-aware harmony). */
export function buildBassHits(
  timeline: HarmonyTimeline,
  durationQuarters: number,
  bpm: number
): BassHit[] {
  const quarter = quarterLengthSeconds(bpm);
  const hits: BassHit[] = [];
  const harmonicStart = timeline.harmonicStartQuarters;
  const { finalBarStartQuarters } = timeline.ending;

  for (let barStart = harmonicStart; barStart < durationQuarters; barStart += MEASURE_QUARTERS) {
    if (barStart >= finalBarStartQuarters) break;

    for (const offset of BASS_BEAT_OFFSETS) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;

      const chord = chordAtQuarter(timeline, beat);
      if (!chord) continue;

      const pitch = offset === 0 ? chordRootPitch(chord) : chordFifthPitch(chord);
      hits.push({
        time: beat * quarter,
        pitch,
        duration: bassHitDuration(offset, quarter),
        velocity: BASS_VELOCITY[offset],
      });
    }
  }

  const fermataChord = chordAtQuarter(timeline, finalBarStartQuarters);
  if (fermataChord && durationQuarters > finalBarStartQuarters) {
    hits.push({
      time: finalBarStartQuarters * quarter,
      pitch: chordRootPitch(fermataChord),
      duration: COMP_FERMATA_HOLD_QUARTERS * quarter,
      velocity: BASS_VELOCITY[0],
    });
  }

  return hits;
}

export function scheduleBassHits(
  player: Sampler,
  timeline: HarmonyTimeline,
  bpm: number,
  startTime: number,
  durationSeconds: number,
  playbackOffsetSeconds = 0
): void {
  const quarter = quarterLengthSeconds(bpm);
  const durationQuarters = durationSeconds / quarter;
  const hits = buildBassHits(timeline, durationQuarters, bpm);

  for (const hit of hits) {
    player.triggerAttackRelease(
      hit.pitch,
      hit.duration,
      startTime + hit.time + playbackOffsetSeconds,
      hit.velocity
    );
  }
}
