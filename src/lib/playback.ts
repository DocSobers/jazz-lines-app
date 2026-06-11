import * as Tone from 'tone';
import type { Note } from '../types';
import { createGuitarSampler } from './guitar-sampler';

type GuitarPlayer = ReturnType<typeof createGuitarSampler>;

let guitar: GuitarPlayer | null = null;
let guitarReady: Promise<GuitarPlayer> | null = null;
let scheduledIds: number[] = [];
let onInterrupted: (() => void) | null = null;

/** 0 = straight eighths, 1 = full triplet jazz swing */
export type SwingAmount = number;

async function ensureAudioReady(): Promise<void> {
  await Tone.start();
  const ctx = Tone.getContext();
  if (ctx.state !== 'running') {
    await ctx.resume();
  }
}

function loadGuitar(): Promise<GuitarPlayer> {
  if (guitar?.loaded) {
    return Promise.resolve(guitar);
  }

  if (!guitarReady) {
    guitarReady = new Promise((resolve) => {
      const instrument = createGuitarSampler(() => {
        instrument.volume.value = -2;
        guitar = instrument;
        resolve(instrument);
      });
      instrument.toDestination();
    });
  }

  return guitarReady;
}

async function ensureGuitar(): Promise<GuitarPlayer> {
  await ensureAudioReady();
  return loadGuitar();
}

/** Safari suspends audio when the tab is hidden; resume and reset on return. */
export function initPlaybackLifecycle(interrupted: () => void): () => void {
  onInterrupted = interrupted;

  const handleReturn = () => {
    void ensureAudioReady();
    stopPlayback();
    interrupted();
  };

  const handleLeave = () => {
    stopPlayback();
    interrupted();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      handleReturn();
    } else {
      handleLeave();
    }
  };

  const onPageShow = () => {
    handleReturn();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pageshow', onPageShow);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', onPageShow);
    if (onInterrupted === interrupted) {
      onInterrupted = null;
    }
  };
}

function quarterSeconds(bpm: number): number {
  Tone.getTransport().bpm.value = bpm;
  return Tone.Time('4n').toSeconds();
}

function noteSeconds(duration: string, bpm: number): number {
  Tone.getTransport().bpm.value = bpm;
  return Tone.Time(duration).toSeconds();
}

function pairFillsQuarter(a: Note, b: Note, bpm: number, quarter: number): boolean {
  const sum = noteSeconds(a.duration, bpm) + noteSeconds(b.duration, bpm);
  return Math.abs(sum - quarter) < 0.001;
}

interface ScheduledNote {
  pitch: string;
  rest?: boolean;
  time: number;
  duration: number;
}

function buildSchedule(
  notes: Note[],
  bpm: number,
  swing: SwingAmount
): ScheduledNote[] {
  const quarter = quarterSeconds(bpm);
  const scheduled: ScheduledNote[] = [];
  let time = 0;
  let i = 0;

  while (i < notes.length) {
    const current = notes[i];
    const next = notes[i + 1];

    if (swing > 0 && next && pairFillsQuarter(current, next, bpm, quarter)) {
      const written1 = noteSeconds(current.duration, bpm) / quarter;
      const written2 = noteSeconds(next.duration, bpm) / quarter;
      const frac1 = 0.5 + swing * (written1 - 0.5);
      const frac2 = 0.5 + swing * (written2 - 0.5);
      scheduled.push({
        pitch: current.pitch,
        rest: current.rest,
        time,
        duration: frac1 * quarter,
      });
      scheduled.push({
        pitch: next.pitch,
        rest: next.rest,
        time: time + frac1 * quarter,
        duration: frac2 * quarter,
      });
      time += quarter;
      i += 2;
      continue;
    }

    const duration = noteSeconds(current.duration, bpm);
    scheduled.push({
      pitch: current.pitch,
      rest: current.rest,
      time,
      duration,
    });
    time += duration;
    i += 1;
  }

  return scheduled;
}

export async function playNotes(
  notes: Note[],
  bpm: number,
  onComplete?: () => void,
  swing: SwingAmount = 1
): Promise<void> {
  stopPlayback();
  const player = await ensureGuitar();
  const schedule = buildSchedule(notes, bpm, swing);
  const start = Tone.now() + 0.15;

  for (const note of schedule) {
    if (!note.rest) {
      player.triggerAttackRelease(note.pitch, note.duration, start + note.time);
    }
  }

  const endTime = schedule.reduce(
    (max, note) => Math.max(max, note.time + note.duration),
    0
  );
  const totalMs = (start + endTime - Tone.now()) * 1000;
  const id = window.setTimeout(() => onComplete?.(), totalMs);
  scheduledIds.push(id);
}

export function stopPlayback(): void {
  scheduledIds.forEach((id) => window.clearTimeout(id));
  scheduledIds = [];
  guitar?.releaseAll();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}

export function disposePlayback(): void {
  stopPlayback();
  guitar?.dispose();
  guitar = null;
  guitarReady = null;
  onInterrupted = null;
}
