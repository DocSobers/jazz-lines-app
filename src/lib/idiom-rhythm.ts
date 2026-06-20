import { endPitchClass, startPitchClass } from './notes';
import { isSwungBeatPair } from './timing';
import type { ChainItem, Example, JoinRhythm, LineRhythm } from '../types';

/** True when every sounding note is an 8t+8t (or 4t+8t) swung pair — not a continuous triplet run. */
function isSwungPairLine(example: Example): boolean {
  const sounding = example.notes.filter((note) => !note.rest);
  if (sounding.length < 2 || sounding.length % 2 !== 0) return false;
  if (!sounding.every((note) => note.duration === '8t')) return false;
  for (let i = 0; i < sounding.length; i += 2) {
    if (!isSwungBeatPair(sounding[i].duration, sounding[i + 1].duration)) {
      return false;
    }
  }
  return true;
}

/** Book uses triplet eighths throughout (e.g. II–V #1b) — join adjusts boundary only. */
export function isFullTripletLine(example: Example): boolean {
  if (isSwungPairLine(example)) return false;

  const sounding = example.notes.filter((note) => !note.rest);
  if (sounding.length === 0) return false;

  return sounding.every((note, index) => {
    if (index === sounding.length - 1) {
      return (
        note.duration === '8t' ||
        note.duration === '4n' ||
        note.duration === '2n' ||
        note.duration === '8n'
      );
    }
    return note.duration === '8t';
  });
}

/** Idioms with a curated demo line variant (book vs demo swung). */
export const LINE_RHYTHM_VARIANT_IDS = new Set(['idiom_v_i_n1a']);

export function supportsLineRhythmVariant(exampleId: string): boolean {
  return LINE_RHYTHM_VARIANT_IDS.has(exampleId);
}

/** Resolve join rhythm; maps legacy `entryRhythm` for older chain state. */
export function resolveJoinRhythm(item: ChainItem): JoinRhythm {
  if (item.joinRhythm) return item.joinRhythm;
  if (item.entryRhythm === 'triplet') return 'tripletCrossBar';
  return 'asWritten';
}

/** Resolve line rhythm for variant idioms; maps legacy `entryRhythm`. */
export function resolveLineRhythm(item: ChainItem): LineRhythm {
  if (item.lineRhythm) return item.lineRhythm;
  if (!supportsLineRhythmVariant(item.example.id)) return 'book';
  if (item.entryRhythm === 'triplet') return 'book';
  return 'demoSwung';
}

export function canOfferTripletCrossBarJoin(prev: Example, curr: ChainItem): boolean {
  if ((curr.registerJoin ?? 'align') !== 'align') return false;
  if (isFullTripletLine(curr.example)) return false;
  if (endPitchClass(prev) !== startPitchClass(curr.example)) return false;
  return true;
}

export function usesTripletCrossBarJoin(item: ChainItem): boolean {
  return resolveJoinRhythm(item) === 'tripletCrossBar';
}
