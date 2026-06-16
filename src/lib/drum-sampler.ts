import { Filter, Sampler } from 'tone';
import { hatClosed, ride as rideSample } from '@teropa/drumkit';

/** Single mapped note — always trigger this so samples play at native pitch. */
const DRUM_NOTE = 'C4';

export type DrumVoice = 'hihat' | 'ride';

export interface DrumKit {
  hihat: Sampler;
  ride: Sampler;
}

let hihatChainHead: Filter | null = null;
let rideChainHead: Filter | null = null;
const drumChainNodes: Filter[] = [];

function ensureHiHatChain(): Filter {
  if (hihatChainHead) return hihatChainHead;

  const highpass = new Filter({
    frequency: 6000,
    type: 'highpass',
    rolloff: -12,
    Q: 0.7,
  });
  highpass.toDestination();
  hihatChainHead = highpass;
  drumChainNodes.push(highpass);
  return highpass;
}

function ensureRideChain(): Filter {
  if (rideChainHead) return rideChainHead;

  const band = new Filter({
    frequency: 3200,
    type: 'bandpass',
    rolloff: -12,
    Q: 0.55,
  });
  band.toDestination();
  rideChainHead = band;
  drumChainNodes.push(band);
  return band;
}

function createOneShotSampler(
  url: string,
  release: number,
  output: Filter,
  onload?: () => void
): Sampler {
  const sampler = new Sampler({
    urls: { [DRUM_NOTE]: url },
    attack: 0.001,
    release,
    curve: 'exponential',
    onload,
  });
  sampler.connect(output);
  return sampler;
}

export function drumSampleUrls(): string[] {
  return [hatClosed, rideSample];
}

export function createDrumKit(onload?: () => void): DrumKit {
  let loaded = 0;
  const check = () => {
    loaded += 1;
    if (loaded === 2) onload?.();
  };

  const hihat = createOneShotSampler(hatClosed, 0.035, ensureHiHatChain(), check);
  const ride = createOneShotSampler(rideSample, 0.5, ensureRideChain(), check);

  return { hihat, ride };
}

export function disposeDrumKit(kit: DrumKit | null): void {
  kit?.hihat.dispose();
  kit?.ride.dispose();
}

export function disposeDrumChains(): void {
  for (const node of drumChainNodes) {
    node.dispose();
  }
  drumChainNodes.length = 0;
  hihatChainHead = null;
  rideChainHead = null;
}

/** @deprecated Use createDrumKit */
export function createDrumSampler(onload?: () => void): Sampler {
  const kit = createDrumKit(onload);
  return kit.hihat;
}
