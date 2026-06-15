import * as Tone from 'tone';

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
 * Count-in clicks through the pickup rest; the final click uses the exact
 * scheduled pickup onset (& of beat 4) so it aligns with the melody.
 */
export function scheduleAnacrusisCountIn(
  startTime: number,
  bpm: number,
  pickupOnsetSeconds: number
): void {
  if (pickupOnsetSeconds <= 0) return;

  const synth = ensureClickSynth();
  const quarter = 60 / bpm;
  const clickDur = 0.04;
  const pickupBeat = pickupOnsetSeconds / quarter;
  const downbeatCount = Math.floor(pickupBeat + 0.001);

  for (let beat = 0; beat < downbeatCount; beat++) {
    const pitch = beat === 0 ? 'C6' : 'G5';
    synth.triggerAttackRelease(pitch, clickDur, startTime + beat * quarter);
  }

  synth.triggerAttackRelease('E6', clickDur, startTime + pickupOnsetSeconds);
}

export function disposeMetronome(): void {
  clickSynth?.dispose();
  clickSynth = null;
}
