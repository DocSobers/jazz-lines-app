import type { SwingAmount } from './playback';
import { swungCompOffsetsInBar } from './comp-schedule';
import type { DrumKit, DrumVoice } from './drum-sampler';
import { quarterLengthSeconds } from './timing';

const DRUM_NOTE = 'C4';

export interface DrumHit {
  time: number;
  voice: DrumVoice;
  duration: number;
  velocity: number;
}

/** Sock hi-hat on beats 2 and 4 (quarter offsets within a bar). */
export const HI_HAT_BEAT_OFFSETS = [1, 3] as const;

const HI_HAT_VELOCITY = 0.62;
const RIDE_VELOCITY: Record<string, number> = {
  '0': 0.84,
  '1': 0.7,
  and2: 0.54,
  '2': 0.66,
  '3': 0.66,
  and4: 0.52,
};

/** Ride on 1, 2, swung & of 2, 3, 4, swung & of 4. */
export function rideBeatOffsetsInBar(swing: SwingAmount): Array<{
  offset: number;
  velocityKey: keyof typeof RIDE_VELOCITY;
}> {
  const [and2, and4] = swungCompOffsetsInBar(swing);
  return [
    { offset: 0, velocityKey: '0' },
    { offset: 1, velocityKey: '1' },
    { offset: and2, velocityKey: 'and2' },
    { offset: 2, velocityKey: '2' },
    { offset: 3, velocityKey: '3' },
    { offset: and4, velocityKey: 'and4' },
  ];
}

function hiHatHitDuration(quarter: number): number {
  return quarter * 0.06;
}

function rideHitDuration(quarter: number): number {
  return quarter * 0.55;
}

export function buildDrumHits(
  durationQuarters: number,
  bpm: number,
  swing: SwingAmount,
  harmonicStartQuarters = 0
): DrumHit[] {
  const quarter = quarterLengthSeconds(bpm);
  const hits: DrumHit[] = [];

  for (let barStart = harmonicStartQuarters; barStart < durationQuarters; barStart += 4) {
    for (const offset of HI_HAT_BEAT_OFFSETS) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;
      hits.push({
        time: beat * quarter,
        voice: 'hihat',
        duration: hiHatHitDuration(quarter),
        velocity: HI_HAT_VELOCITY,
      });
    }

    for (const { offset, velocityKey } of rideBeatOffsetsInBar(swing)) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;
      hits.push({
        time: beat * quarter,
        voice: 'ride',
        duration: rideHitDuration(quarter),
        velocity: RIDE_VELOCITY[velocityKey],
      });
    }
  }

  return hits;
}

export function scheduleDrumHits(
  kit: DrumKit,
  bpm: number,
  swing: SwingAmount,
  startTime: number,
  durationSeconds: number,
  harmonicStartQuarters = 0,
  playbackOffsetSeconds = 0
): void {
  const quarter = quarterLengthSeconds(bpm);
  const durationQuarters = durationSeconds / quarter;
  const hits = buildDrumHits(durationQuarters, bpm, swing, harmonicStartQuarters);

  for (const hit of hits) {
    const player = hit.voice === 'hihat' ? kit.hihat : kit.ride;
    player.triggerAttackRelease(
      DRUM_NOTE,
      hit.duration,
      startTime + hit.time + playbackOffsetSeconds,
      hit.velocity
    );
  }
}
