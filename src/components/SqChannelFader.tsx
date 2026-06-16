import { useCallback, useRef } from 'react';
import {
  faderDbToTravel,
  formatFaderDb,
  MIXER_UNITY,
  stepFaderDb,
  travelToFaderDb,
  UNITY_TRAVEL,
} from '../lib/mixer';

interface SqChannelFaderProps {
  valueDb: number;
  onChange: (db: number) => void;
  label: string;
  isDefault?: boolean;
}

export default function SqChannelFader({
  valueDb,
  onChange,
  label,
  isDefault = false,
}: SqChannelFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const travel = faderDbToTravel(valueDb);
  const unityTop = (1 - UNITY_TRAVEL) * 100;

  const travelFromPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return travel;
    const rect = track.getBoundingClientRect();
    const t = 1 - (clientY - rect.top) / rect.height;
    return Math.min(1, Math.max(0, t));
  }, [travel]);

  const commitTravel = useCallback(
    (t: number) => {
      onChange(travelToFaderDb(t));
    },
    [onChange]
  );

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    commitTravel(travelFromPointer(e.clientY));
  };

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    commitTravel(travelFromPointer(e.clientY));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(stepFaderDb(valueDb, 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(stepFaderDb(valueDb, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(10);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(-40);
    }
  };

  return (
    <div
      ref={trackRef}
      className="sq-fader"
      role="slider"
      tabIndex={0}
      aria-label={`${label} fader`}
      aria-valuemin={-40}
      aria-valuemax={10}
      aria-valuenow={valueDb}
      aria-valuetext={
        valueDb === MIXER_UNITY
          ? '0 decibels, unity'
          : `${formatFaderDb(valueDb)} decibels${isDefault ? ', default' : ''}`
      }
      onPointerDown={onTrackPointerDown}
      onPointerMove={onTrackPointerMove}
      onKeyDown={onKeyDown}
    >
      <div className="sq-fader__boost" style={{ height: `${unityTop}%` }} aria-hidden />
      <div
        className="sq-fader__unity-zone"
        style={{ top: `${unityTop}%`, height: `${100 - unityTop}%` }}
        aria-hidden
      />
      <div className="sq-fader__unity-line" style={{ top: `${unityTop}%` }} aria-hidden />
      <div
        className="sq-fader__cap"
        style={{ bottom: `calc(${travel * 100}% - 7px)` }}
        aria-hidden
      />
    </div>
  );
}
