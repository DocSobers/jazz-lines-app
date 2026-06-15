import * as Tone from 'tone';
import { quarterLengthSeconds } from './timing';

let clickSynth: Tone.MembraneSynth | null = null;

function ensureClickSynth(): Tone.MembraneSynth {
  if (!clickSynth) {
    clickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    }).toDestination();
    clickSynth.volume.value = -14;
  }
  return clickSynth;
}

/**
 * Count-in: beats 1–4 downbeats, then & of beat 4 synced to melody pickup.
 * pickupOnsetQuarters is spreadsheet StartTime (e.g. 3.67 = triplet & of 4).
 */
export function scheduleAnacrusisCountIn(
  startTime: number,
  bpm: number,
  pickupOnsetQuarters: number
): void {
  const synth = ensureClickSynth();
  const quarter = quarterLengthSeconds(bpm);
  const clickDur = 0.04;

  for (let beat = 0; beat < 4; beat++) {
    const pitch = beat === 0 ? 'C6' : 'G5';
    synth.triggerAttackRelease(pitch, clickDur, startTime + beat * quarter);
  }

  synth.triggerAttackRelease('E6', clickDur, startTime + pickupOnsetQuarters * quarter);
}

export function disposeMetronome(): void {
  clickSynth?.dispose();
  clickSynth = null;
}
