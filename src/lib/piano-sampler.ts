import { Sampler } from 'tone';

/** Sparse piano map (tonejs AUDIO_MIN) — good range with fewer samples to load/cache. */
import A1 from 'tonejs-instrument-piano-mp3/A1.mp3';
import As4 from 'tonejs-instrument-piano-mp3/As4.mp3';
import B7 from 'tonejs-instrument-piano-mp3/B7.mp3';
import Cs2 from 'tonejs-instrument-piano-mp3/Cs2.mp3';
import D5 from 'tonejs-instrument-piano-mp3/D5.mp3';
import E1 from 'tonejs-instrument-piano-mp3/E1.mp3';
import F4 from 'tonejs-instrument-piano-mp3/F4.mp3';
import Fs7 from 'tonejs-instrument-piano-mp3/Fs7.mp3';
import Gs3 from 'tonejs-instrument-piano-mp3/Gs3.mp3';

const PIANO_URLS: Record<string, string> = {
  A1,
  'A#4': As4,
  B7,
  'C#2': Cs2,
  D5,
  E1,
  F4,
  'F#7': Fs7,
  'G#3': Gs3,
};

export function pianoSampleUrls(): string[] {
  return Object.values(PIANO_URLS);
}

export function createPianoSampler(onload?: () => void): Sampler {
  return new Sampler({
    urls: PIANO_URLS,
    attack: 0.001,
    onload,
  });
}
