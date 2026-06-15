import type { Sampler } from 'tone';
import type { WheelKey } from './keys';
import { iiViProgression } from './comp-progression';
import { chordFifthPitch, chordRootPitch } from './comp-voicings';
import { quarterLengthSeconds } from './timing';

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

/** Build bass hits: root on beat 1, fifth on beat 3. */
export function buildBassHits(
  key: WheelKey,
  durationQuarters: number,
  bpm: number,
  harmonicStartQuarters = 0
): BassHit[] {
  const progression = iiViProgression(key);
  const quarter = quarterLengthSeconds(bpm);
  const hits: BassHit[] = [];

  for (let barStart = harmonicStartQuarters; barStart < durationQuarters; barStart += 4) {
    const barIndex =
      Math.floor((barStart - harmonicStartQuarters) / 4) % progression.length;
    const chord = progression[barIndex].chord;

    for (const offset of BASS_BEAT_OFFSETS) {
      const beat = barStart + offset;
      if (beat >= durationQuarters) continue;
      const pitch = offset === 0 ? chordRootPitch(chord) : chordFifthPitch(chord);
      hits.push({
        time: beat * quarter,
        pitch,
        duration: bassHitDuration(offset, quarter),
        velocity: BASS_VELOCITY[offset],
      });
    }
  }

  return hits;
}

export function scheduleBassHits(
  player: Sampler,
  key: WheelKey,
  bpm: number,
  startTime: number,
  durationSeconds: number,
  harmonicStartQuarters = 0,
  playbackOffsetSeconds = 0
): void {
  const quarter = quarterLengthSeconds(bpm);
  const durationQuarters = durationSeconds / quarter;
  const hits = buildBassHits(key, durationQuarters, bpm, harmonicStartQuarters);

  for (const hit of hits) {
    player.triggerAttackRelease(
      hit.pitch,
      hit.duration,
      startTime + hit.time + playbackOffsetSeconds,
      hit.velocity
    );
  }
}
