import { compInstrumentLabel } from '../lib/comp';
import type { InstrumentId } from '../lib/instruments';
import {
  DEFAULT_MIXER_LEVELS,
  formatFaderDb,
  MIXER_UNITY,
  scaleMarkBottomPercent,
  SQ_FADER_SCALE_MARKS,
  type MixerChannel,
  type MixerLevels,
} from '../lib/mixer';
import SqChannelFader from './SqChannelFader';

interface BackingMixerProps {
  melodyInstrument: InstrumentId;
  levels: MixerLevels;
  defaultLevels: MixerLevels;
  onChange: (channel: MixerChannel, value: number) => void;
  onReset?: () => void;
}

const CHANNEL_META: { id: MixerChannel; label: string; short: string }[] = [
  { id: 'melody', label: 'Melody', short: 'Mel' },
  { id: 'comp', label: 'Comp', short: 'Cmp' },
  { id: 'bass', label: 'Bass', short: 'Bas' },
  { id: 'hihat', label: 'Hi-hat', short: 'Hat' },
  { id: 'ride', label: 'Ride', short: 'Rid' },
];

export default function BackingMixer({
  melodyInstrument,
  levels,
  defaultLevels,
  onChange,
  onReset,
}: BackingMixerProps) {
  const compLabel = compInstrumentLabel(melodyInstrument).replace(' comp', '');

  return (
    <div className="backing-mixer" aria-label="Instrument mix">
      <div className="backing-mixer__top">
        <span className="backing-mixer__label">Mix</span>
        {onReset && (
          <button
            type="button"
            className="backing-mixer__reset"
            onClick={onReset}
            aria-label="Reset mix to defaults"
            title="Reset mix"
          >
            ↺
          </button>
        )}
      </div>
      <div className="backing-mixer__desk" role="group" aria-label="SQ-style faders in decibels">
        <div className="backing-mixer__scale" aria-hidden>
          {SQ_FADER_SCALE_MARKS.map(({ db, label }) => (
            <span
              key={db}
              className={`backing-mixer__scale-mark${
                db === MIXER_UNITY ? ' backing-mixer__scale-mark--unity' : ''
              }${db > 0 ? ' backing-mixer__scale-mark--plus' : ''}`}
              style={{ bottom: `${scaleMarkBottomPercent(db)}%` }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="backing-mixer__strips">
          {CHANNEL_META.map(({ id, label, short }) => {
            const displayLabel =
              id === 'comp' ? compLabel : id === 'melody' ? 'Melody' : label;
            const valueDb = levels[id];
            const isDefault = valueDb === defaultLevels[id];
            const displayDb = formatFaderDb(valueDb);

            return (
              <div key={id} className="backing-mixer__strip" title={displayLabel}>
                <span className="backing-mixer__strip-label">{short}</span>
                <SqChannelFader
                  valueDb={valueDb}
                  onChange={(db) => onChange(id, db)}
                  label={displayLabel}
                  isDefault={isDefault}
                />
                <span
                  className={`backing-mixer__strip-value${
                    valueDb === MIXER_UNITY ? ' backing-mixer__strip-value--unity' : ''
                  }${valueDb > 0 ? ' backing-mixer__strip-value--plus' : ''}`}
                  aria-hidden
                >
                  {displayDb}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_MIXER_LEVELS };
