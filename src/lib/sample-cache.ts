import { INSTRUMENTS, type InstrumentId } from './instruments';
import { fluteSampleUrls } from './flute-sampler';
import { nylonSampleUrls } from './guitar-sampler';
import { pianoSampleUrls } from './piano-sampler';

const SW_URL = '/instrument-sample-sw.js';
let registerPromise: Promise<void> | null = null;

export function instrumentSampleUrls(id: InstrumentId): string[] {
  switch (id) {
    case 'nylon':
      return nylonSampleUrls();
    case 'flute':
      return fluteSampleUrls();
    case 'piano':
      return pianoSampleUrls();
    default:
      return nylonSampleUrls();
  }
}

function allSampleUrls(): string[] {
  return [...new Set(INSTRUMENTS.flatMap((item) => instrumentSampleUrls(item.id)))];
}

/** Register a service worker that caches .mp3 sample requests across visits. */
export function registerSampleCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve();
  }

  registerPromise ??= navigator.serviceWorker
    .register(SW_URL, { scope: '/' })
    .then(() => undefined)
    .catch(() => undefined);

  return registerPromise;
}

/** Prefetch sample files into the Cache API (and HTTP cache). */
export async function warmSampleCache(urls: string[] = allSampleUrls()): Promise<void> {
  await registerSampleCache();

  if (!('caches' in window)) {
    await Promise.all(urls.map((url) => fetch(url).catch(() => undefined)));
    return;
  }

  const cache = await caches.open('jazz-lines-instruments-v1');
  await Promise.all(
    urls.map(async (url) => {
      const request = new Request(url);
      if (await cache.match(request)) return;
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch {
        /* offline or blocked */
      }
    })
  );
}

export async function warmInstrumentCache(id: InstrumentId): Promise<void> {
  await warmSampleCache(instrumentSampleUrls(id));
}
