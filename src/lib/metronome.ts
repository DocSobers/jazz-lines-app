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

/** Quarter-note clicks for one anacrusis/count-in bar (beats 1–4). */
export function scheduleAnacrusisCountIn(
  startTime: number,
  bpm: number,
  measureQuarters = 4
): void {
  const synth = ensureClickSynth();
  const quarter = 60 / bpm;
  const clickDur = 0.04;

  for (let beat = 0; beat < measureQuarters; beat++) {
    const pitch = beat === 0 ? 'C6' : 'G5';
    synth.triggerAttackRelease(pitch, clickDur, startTime + beat * quarter);
  }
}

export function disposeMetronome(): void {
  clickSynth?.dispose();
  clickSynth = null;
}
