import { EQ3, Filter, Sampler } from 'tone';

import As1 from 'tonejs-instrument-bass-electric-mp3/As1.mp3';
import As2 from 'tonejs-instrument-bass-electric-mp3/As2.mp3';
import As3 from 'tonejs-instrument-bass-electric-mp3/As3.mp3';
import Cs1 from 'tonejs-instrument-bass-electric-mp3/Cs1.mp3';
import Cs2 from 'tonejs-instrument-bass-electric-mp3/Cs2.mp3';
import Cs3 from 'tonejs-instrument-bass-electric-mp3/Cs3.mp3';
import Cs4 from 'tonejs-instrument-bass-electric-mp3/Cs4.mp3';
import E1 from 'tonejs-instrument-bass-electric-mp3/E1.mp3';
import E2 from 'tonejs-instrument-bass-electric-mp3/E2.mp3';
import E3 from 'tonejs-instrument-bass-electric-mp3/E3.mp3';
import G1 from 'tonejs-instrument-bass-electric-mp3/G1.mp3';
import G2 from 'tonejs-instrument-bass-electric-mp3/G2.mp3';
import G3 from 'tonejs-instrument-bass-electric-mp3/G3.mp3';

/**
 * Fingered jazz bass (tonejs bass-electric). No dedicated acoustic upright
 * pizz pack — this is the warmest fingerstyle set for Akoustic Band feel.
 */
const JAZZ_BASS_URLS: Record<string, string> = {
  E1,
  G1,
  'A#1': As1,
  'C#1': Cs1,
  'C#2': Cs2,
  E2,
  G2,
  'A#2': As2,
  'C#3': Cs3,
  E3,
  G3,
  'A#3': As3,
  'C#4': Cs4,
};

const JAZZ_PIZZ_ATTACK = 0.012;
const JAZZ_PIZZ_RELEASE = 0.42;

let bassChainHead: Filter | null = null;
let bassChainNodes: Array<Filter | EQ3> = [];

function ensureBassChainInput(): Filter {
  if (bassChainHead) return bassChainHead;

  const highpass = new Filter({
    frequency: 48,
    type: 'highpass',
    rolloff: -12,
    Q: 0.5,
  });
  const lowpass = new Filter({
    frequency: 2200,
    type: 'lowpass',
    rolloff: -12,
    Q: 0.45,
  });
  const eq = new EQ3({
    low: 2.5,
    mid: -1,
    high: -2.5,
  });

  highpass.chain(lowpass, eq);
  eq.toDestination();

  bassChainHead = highpass;
  bassChainNodes = [highpass, lowpass, eq];
  return highpass;
}

export function bassSampleUrls(): string[] {
  return Object.values(JAZZ_BASS_URLS);
}

/** @deprecated Use bassSampleUrls */
export const contrabassSampleUrls = bassSampleUrls;

export function createBassSampler(onload?: () => void): Sampler {
  const sampler = new Sampler({
    urls: JAZZ_BASS_URLS,
    attack: JAZZ_PIZZ_ATTACK,
    release: JAZZ_PIZZ_RELEASE,
    curve: 'linear',
    onload,
  });
  sampler.connect(ensureBassChainInput());
  return sampler;
}

/** @deprecated Use createBassSampler */
export const createContrabassSampler = createBassSampler;

export function disposeBassChain(): void {
  for (const node of bassChainNodes) {
    node.dispose();
  }
  bassChainNodes = [];
  bassChainHead = null;
}

/** @deprecated Use disposeBassChain */
export const disposeContrabassChain = disposeBassChain;
