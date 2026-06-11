import type { CSSProperties } from 'react';
import {
  keyDisplayLabel,
  REFERENCE_KEY,
  WHEEL_KEYS,
  type WheelKey,
} from '../lib/keys';

interface KeyWheelProps {
  selectedKey: WheelKey;
  onChange: (key: WheelKey) => void;
}

export default function KeyWheel({ selectedKey, onChange }: KeyWheelProps) {
  return (
    <div className="key-wheel-wrap">
      <span className="key-wheel-wrap__label">Key</span>
      <div className="key-wheel" role="group" aria-label="Transpose key">
        <div className="key-wheel__center" aria-hidden>
          <span className="key-wheel__center-label">{keyDisplayLabel(selectedKey)}</span>
          {selectedKey !== REFERENCE_KEY && (
            <span className="key-wheel__center-hint">from {REFERENCE_KEY}</span>
          )}
        </div>
        {WHEEL_KEYS.map((key, index) => {
          const angle = index * 30;
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              className={`key-wheel__key ${isSelected ? 'key-wheel__key--selected' : ''}`}
              style={{ '--angle': `${angle}deg` } as CSSProperties}
              onClick={() => onChange(key)}
              aria-pressed={isSelected}
              aria-label={`Key of ${keyDisplayLabel(key)}`}
              title={`Key of ${key}`}
            >
              {keyDisplayLabel(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
