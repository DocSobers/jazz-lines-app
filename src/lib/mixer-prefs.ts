import {
  DEFAULT_MIXER_LEVELS,
  MIXER_CEILING,
  MIXER_FLOOR,
  type MixerChannel,
  type MixerLevels,
} from './mixer';

const STORAGE_KEY = 'jazz-lines-mixer-defaults';

const CHANNELS: MixerChannel[] = ['melody', 'comp', 'bass', 'hihat', 'ride'];

function clampFaderDb(db: unknown): number | null {
  if (typeof db !== 'number' || !Number.isFinite(db)) return null;
  return Math.min(MIXER_CEILING, Math.max(MIXER_FLOOR, Math.round(db)));
}

function parseLevels(raw: unknown): MixerLevels | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const levels = { ...DEFAULT_MIXER_LEVELS };
  for (const ch of CHANNELS) {
    const db = clampFaderDb(obj[ch]);
    if (db == null) return null;
    levels[ch] = db;
  }
  return levels;
}

function readStorage(): MixerLevels | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseLevels(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeStorage(levels: MixerLevels): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

/** Saved default mix — loads on startup and after ↺ reset. */
export function loadMixerDefaults(): MixerLevels {
  return readStorage() ?? { ...DEFAULT_MIXER_LEVELS };
}

export function persistMixerDefaults(levels: MixerLevels): void {
  writeStorage(levels);
}

export function resetMixerToDefaults(): MixerLevels {
  const defaults = { ...DEFAULT_MIXER_LEVELS };
  writeStorage(defaults);
  return defaults;
}
