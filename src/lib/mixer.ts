import { instrumentVolume, type InstrumentId } from './instruments';
import {
  bassVolumeDb,
  compVolumeDb,
  hiHatVolumeDb,
  rideVolumeDb,
} from './comp-instruments';

export type MixerChannel = 'melody' | 'comp' | 'bass' | 'hihat' | 'ride';

/** Channel fader reading in dB (SQ-style: +headroom above 0, attenuation below). */
export interface MixerLevels {
  melody: number;
  comp: number;
  bass: number;
  hihat: number;
  ride: number;
}

/** Unity — nominal channel level (SQ fader “0”). */
export const MIXER_UNITY = 0;

/** Top of fader travel (+10 dB boost region). */
export const MIXER_CEILING = 10;

/** Bottom of practical fader travel. */
export const MIXER_FLOOR = -40;

/**
 * Allen & Heath SQ-style fader law: unity ~¾ up from the bottom,
 * +dB in the top quarter, −dB below.
 * `t` = normalized travel (0 bottom → 1 top).
 */
export const SQ_FADER_CURVE: ReadonlyArray<{ t: number; db: number }> = [
  { t: 0, db: MIXER_FLOOR },
  { t: 0.12, db: -30 },
  { t: 0.28, db: -20 },
  { t: 0.44, db: -10 },
  { t: 0.58, db: -5 },
  { t: 0.75, db: MIXER_UNITY },
  { t: 0.86, db: 5 },
  { t: 1, db: MIXER_CEILING },
];

/** Normalized travel where the fader reads 0 dB (¾ up from bottom). */
export const UNITY_TRAVEL = 0.75;

/** Scale ticks shown beside the faders (top → bottom). */
export const SQ_FADER_SCALE_MARKS: ReadonlyArray<{ db: number; label: string }> = [
  { db: 10, label: '+10' },
  { db: 5, label: '+5' },
  { db: 0, label: '0' },
  { db: -10, label: '−10' },
  { db: -20, label: '−20' },
  { db: -30, label: '−30' },
  { db: -40, label: '−40' },
];


export const DEFAULT_MIXER_LEVELS: MixerLevels = {
  melody: MIXER_UNITY,
  comp: -10,
  bass: -10,
  hihat: -20,
  ride: -20,
};

function interpolateCurve(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 1; i < SQ_FADER_CURVE.length; i++) {
    const prev = SQ_FADER_CURVE[i - 1];
    const next = SQ_FADER_CURVE[i];
    if (clamped <= next.t) {
      const span = next.t - prev.t;
      if (span <= 0) return next.db;
      const frac = (clamped - prev.t) / span;
      return prev.db + frac * (next.db - prev.db);
    }
  }
  return SQ_FADER_CURVE[SQ_FADER_CURVE.length - 1].db;
}

function invertCurve(targetDb: number): number {
  const clamped = Math.min(MIXER_CEILING, Math.max(MIXER_FLOOR, targetDb));
  for (let i = 1; i < SQ_FADER_CURVE.length; i++) {
    const prev = SQ_FADER_CURVE[i - 1];
    const next = SQ_FADER_CURVE[i];
    const lo = Math.min(prev.db, next.db);
    const hi = Math.max(prev.db, next.db);
    if (clamped >= lo && clamped <= hi) {
      const span = next.db - prev.db;
      if (Math.abs(span) < 1e-9) return next.t;
      const frac = (clamped - prev.db) / span;
      return prev.t + frac * (next.t - prev.t);
    }
  }
  return clamped >= MIXER_UNITY ? 1 : 0;
}

/** Normalized fader position (0 bottom, 1 top) for a dB reading. */
export function faderDbToTravel(db: number): number {
  return invertCurve(db);
}

/** dB reading for a normalized fader position. */
export function travelToFaderDb(travel: number): number {
  return Math.round(interpolateCurve(travel));
}

export function stepFaderDb(db: number, delta: number): number {
  return Math.min(MIXER_CEILING, Math.max(MIXER_FLOOR, db + delta));
}

/** Vertical position from bottom (0–100) for a dB tick or fader cap. */
export function scaleMarkBottomPercent(db: number): number {
  return faderDbToTravel(db) * 100;
}

/** Vertical position (0 top, 1 bottom) for a scale tick in the fader lane. */
export function scaleMarkTopPercent(db: number): number {
  return (1 - faderDbToTravel(db)) * 100;
}

export function formatFaderDb(db: number): string {
  if (db > 0) return `+${db}`;
  if (db === 0) return '0';
  return String(db);
}

export function channelVolumeDb(nominalDb: number, faderDb: number): number {
  return Math.max(-60, nominalDb + faderDb);
}

export function melodyVolumeDb(melody: InstrumentId, faderDb: number): number {
  return channelVolumeDb(instrumentVolume(melody), faderDb);
}

export function compMixerVolumeDb(comp: InstrumentId, faderDb: number): number {
  return channelVolumeDb(compVolumeDb(comp), faderDb);
}

export function bassMixerVolumeDb(faderDb: number): number {
  return channelVolumeDb(bassVolumeDb(), faderDb);
}

export function hiHatMixerVolumeDb(faderDb: number): number {
  return channelVolumeDb(hiHatVolumeDb(), faderDb);
}

export function rideMixerVolumeDb(faderDb: number): number {
  return channelVolumeDb(rideVolumeDb(), faderDb);
}
