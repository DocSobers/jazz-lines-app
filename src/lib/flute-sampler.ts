import { Sampler } from 'tone';

import A4 from 'tonejs-instrument-flute-mp3/A4.mp3';
import A5 from 'tonejs-instrument-flute-mp3/A5.mp3';
import A6 from 'tonejs-instrument-flute-mp3/A6.mp3';
import C4 from 'tonejs-instrument-flute-mp3/C4.mp3';
import C5 from 'tonejs-instrument-flute-mp3/C5.mp3';
import C6 from 'tonejs-instrument-flute-mp3/C6.mp3';
import C7 from 'tonejs-instrument-flute-mp3/C7.mp3';
import E4 from 'tonejs-instrument-flute-mp3/E4.mp3';
import E5 from 'tonejs-instrument-flute-mp3/E5.mp3';
import E6 from 'tonejs-instrument-flute-mp3/E6.mp3';

const FLUTE_URLS: Record<string, string> = {
  A4,
  A5,
  A6,
  C4,
  C5,
  C6,
  C7,
  E4,
  E5,
  E6,
};

export function fluteSampleUrls(): string[] {
  return Object.values(FLUTE_URLS);
}

export function createFluteSampler(onload?: () => void): Sampler {
  return new Sampler({
    urls: FLUTE_URLS,
    onload,
  });
}
