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
 * Click quarter-note beats during the pickup rest only — stops when the
 * anacrusis melody enters (not a fixed four-beat count-in).
 */
export function scheduleAnacrusisCountIn(
  startTime: number,
  bpm: number,
  leadingRestQuarters: number
): void {
  if (leadingRestQuarters <= 0) return;

  const synth = ensureClickSynth();
  const quarter = 60 / bpm;
  const clickDur = 0.04;

  for (let beat = 0; beat + 0.001 < leadingRestQuarters; beat++) {
    const pitch = beat === 0 ? 'C6' : 'G5';
    synth.triggerAttackRelease(pitch, clickDur, startTime + beat * quarter);
  }
}

export function disposeMetronome(): void {
  clickSynth?.dispose();
  clickSynth = null;
}
