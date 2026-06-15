import { Sampler } from 'tone';

import A2 from 'tonejs-instrument-guitar-nylon-mp3/A2.mp3';
import A3 from 'tonejs-instrument-guitar-nylon-mp3/A3.mp3';
import A4 from 'tonejs-instrument-guitar-nylon-mp3/A4.mp3';
import A5 from 'tonejs-instrument-guitar-nylon-mp3/A5.mp3';
import As5 from 'tonejs-instrument-guitar-nylon-mp3/As5.mp3';
import B1 from 'tonejs-instrument-guitar-nylon-mp3/B1.mp3';
import B2 from 'tonejs-instrument-guitar-nylon-mp3/B2.mp3';
import B3 from 'tonejs-instrument-guitar-nylon-mp3/B3.mp3';
import B4 from 'tonejs-instrument-guitar-nylon-mp3/B4.mp3';
import Cs3 from 'tonejs-instrument-guitar-nylon-mp3/Cs3.mp3';
import Cs4 from 'tonejs-instrument-guitar-nylon-mp3/Cs4.mp3';
import Cs5 from 'tonejs-instrument-guitar-nylon-mp3/Cs5.mp3';
import D2 from 'tonejs-instrument-guitar-nylon-mp3/D2.mp3';
import D3 from 'tonejs-instrument-guitar-nylon-mp3/D3.mp3';
import D5 from 'tonejs-instrument-guitar-nylon-mp3/D5.mp3';
import Ds4 from 'tonejs-instrument-guitar-nylon-mp3/Ds4.mp3';
import E2 from 'tonejs-instrument-guitar-nylon-mp3/E2.mp3';
import E3 from 'tonejs-instrument-guitar-nylon-mp3/E3.mp3';
import E4 from 'tonejs-instrument-guitar-nylon-mp3/E4.mp3';
import E5 from 'tonejs-instrument-guitar-nylon-mp3/E5.mp3';
import Fs2 from 'tonejs-instrument-guitar-nylon-mp3/Fs2.mp3';
import Fs3 from 'tonejs-instrument-guitar-nylon-mp3/Fs3.mp3';
import Fs4 from 'tonejs-instrument-guitar-nylon-mp3/Fs4.mp3';
import Fs5 from 'tonejs-instrument-guitar-nylon-mp3/Fs5.mp3';
import G3 from 'tonejs-instrument-guitar-nylon-mp3/G3.mp3';
import G5 from 'tonejs-instrument-guitar-nylon-mp3/G5.mp3';
import Gs2 from 'tonejs-instrument-guitar-nylon-mp3/Gs2.mp3';
import Gs4 from 'tonejs-instrument-guitar-nylon-mp3/Gs4.mp3';
import Gs5 from 'tonejs-instrument-guitar-nylon-mp3/Gs5.mp3';

const ALL_URLS: Record<string, string> = {
  A2,
  A3,
  A4,
  A5,
  'A#5': As5,
  B1,
  B2,
  B3,
  B4,
  'C#3': Cs3,
  'C#4': Cs4,
  'C#5': Cs5,
  D2,
  D3,
  D5,
  'D#4': Ds4,
  E2,
  E3,
  E4,
  E5,
  'F#2': Fs2,
  'F#3': Fs3,
  'F#4': Fs4,
  'F#5': Fs5,
  G3,
  G5,
  'G#2': Gs2,
  'G#4': Gs4,
  'G#5': Gs5,
};

/**
 * Recordings in tonejs-instrument-guitar-nylon-mp3 whose filenames do not match
 * their actual pitch (e.g. A4.mp3 is A3, D5.mp3 is ~Eb5). Omit them so Tone
 * repitches from correctly labeled neighbors instead of playing 1:1.
 */
const MISLABELED_SAMPLES = new Set([
  'A4',
  'A#5',
  'B4',
  'D5',
  'F#4',
  'G5',
  'G#4',
]);

function tunedUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const [note, url] of Object.entries(ALL_URLS)) {
    if (!MISLABELED_SAMPLES.has(note)) {
      urls[note] = url;
    }
  }
  return urls;
}

export function nylonSampleUrls(): string[] {
  return Object.values(tunedUrls());
}

export function createGuitarSampler(onload?: () => void): Sampler {
  return new Sampler({
    urls: tunedUrls(),
    attack: 0.001,
    onload,
  });
}
