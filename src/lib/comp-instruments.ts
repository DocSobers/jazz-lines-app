import { instrumentVolume, type InstrumentId } from './instruments';

/** Comp instrument paired with the user's melody choice (avoids piano-on-piano). */
export function compInstrumentForMelody(melody: InstrumentId): InstrumentId {
  return melody === 'piano' ? 'nylon' : 'piano';
}

export function compInstrumentLabel(melody: InstrumentId): string {
  const comp = compInstrumentForMelody(melody);
  if (comp === 'piano') return 'Piano comp';
  return 'Guitar comp';
}

/** dB offset applied when an instrument is used for backing (under the melody). */
export function compVolumeDb(instrument: InstrumentId): number {
  return instrumentVolume(instrument) - 10;
}

/** Upright jazz bass sits under the melody and comp. */
export function bassVolumeDb(): number {
  return -2;
}

/** Jazz drum kit under the comp — hi-hat and ride. */
export function drumVolumeDb(): number {
  return -6;
}

/** Closed hi-hat sock on 2 & 4. */
export function hiHatVolumeDb(): number {
  return -14;
}

/** Ride jazz pattern — bell/body under the hi-hat. */
export function rideVolumeDb(): number {
  return -9;
}
