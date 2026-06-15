import * as Tone from 'tone';
import type { Sampler } from 'tone';
import type { Note } from '../types';
import {
  createInstrumentSampler,
  INSTRUMENTS,
  instrumentVolume,
  type InstrumentId,
} from './instruments';
import { warmInstrumentCache, warmSampleCache, registerSampleCache } from './sample-cache';

let currentInstrumentId: InstrumentId = 'nylon';
const players: Partial<Record<InstrumentId, Sampler>> = {};
const loadPromises: Partial<Record<InstrumentId, Promise<Sampler>>> = {};
let scheduledIds: number[] = [];
let playbackGeneration = 0;
let onInterrupted: (() => void) | null = null;
let loopActive = false;

/** Fixed rest before each loop repeat (after the first play-through). */
const LOOP_REPEAT_REST: Note = { rest: true, pitch: 'R', duration: '8n' };

/** 0 = straight eighths, 1 = full triplet jazz swing */
export type SwingAmount = number;

async function ensureAudioReady(): Promise<void> {
  await Tone.start();
  const ctx = Tone.getContext();
  if (ctx.state !== 'running') {
    await ctx.resume();
  }
}

function loadInstrument(id: InstrumentId): Promise<Sampler> {
  const cached = players[id];
  if (cached?.loaded) {
    return Promise.resolve(cached);
  }

  const pending = loadPromises[id];
  if (pending) return pending;

  const promise = new Promise<Sampler>((resolve) => {
    const instrument = createInstrumentSampler(id, () => {
      instrument.volume.value = instrumentVolume(id);
      players[id] = instrument;
      resolve(instrument);
    });
    instrument.toDestination();
  });

  loadPromises[id] = promise;
  return promise;
}

async function ensurePlayer(): Promise<Sampler> {
  await ensureAudioReady();
  return loadInstrument(currentInstrumentId);
}

function activePlayer(): Sampler | null {
  return players[currentInstrumentId] ?? null;
}

/** Switch playback instrument (stops current audio). */
export function setPlaybackInstrument(id: InstrumentId): void {
  if (id === currentInstrumentId) return;
  stopPlayback();
  currentInstrumentId = id;
  void loadInstrument(id);
}

/** Load samples early to reduce first-play latency. */
export function preloadInstrument(id: InstrumentId = currentInstrumentId): void {
  void loadInstrument(id);
}

/** Cache sample MP3s and decode all instruments in the background. */
export function preloadAllInstruments(priorityId: InstrumentId = currentInstrumentId): void {
  void (async () => {
    await registerSampleCache();
    await warmInstrumentCache(priorityId);
    await loadInstrument(priorityId);
    await warmSampleCache();
    await Promise.all(
      INSTRUMENTS.filter((item) => item.id !== priorityId).map((item) =>
        loadInstrument(item.id)
      )
    );
  })();
}

/** @deprecated Use preloadInstrument */
export function preloadGuitar(): void {
  preloadInstrument('nylon');
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

export type { ScheduledNote };

export function buildSchedule(
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

function cancelProgressTracking(): void {
  Tone.Draw.cancel(0);
}

function scheduleTotalDuration(schedule: ScheduledNote[]): number {
  return schedule.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
}

export function leadingRestDuration(
  notes: Note[],
  bpm: number,
  swing: SwingAmount
): number {
  const leading: Note[] = [];
  for (const note of notes) {
    if (!note.rest) break;
    leading.push(note);
  }
  if (leading.length === 0) return 0;
  return scheduleTotalDuration(buildSchedule(leading, bpm, swing));
}

export interface PlaybackProgress {
  elapsed: number;
  totalDuration: number;
  contentDuration: number;
  leadingSkip: number;
  isRepeat: boolean;
}

function startProgressTracking(
  generation: number,
  startTime: number,
  totalDuration: number,
  contentDuration: number,
  leadingSkip: number,
  isRepeat: boolean,
  onProgress?: (progress: PlaybackProgress) => void
): void {
  cancelProgressTracking();
  if (!onProgress || totalDuration <= 0) return;

  const emit = (time: number) => {
    if (generation !== playbackGeneration) return;
    onProgress({
      elapsed: Math.min(Math.max(0, time - startTime), totalDuration),
      totalDuration,
      contentDuration,
      leadingSkip,
      isRepeat,
    });
  };

  const scheduleTick = (drawTime: number) => {
    Tone.Draw.schedule(() => {
      if (generation !== playbackGeneration) return;
      emit(drawTime);
      const elapsed = drawTime - startTime;
      if (elapsed < totalDuration) {
        scheduleTick(drawTime + 1 / 60);
      } else {
        emit(startTime + totalDuration);
      }
    }, drawTime);
  };

  scheduleTick(startTime);
}

interface SchedulePassResult {
  durationMs: number;
  startTime: number;
  schedule: ScheduledNote[];
  totalDuration: number;
}

function schedulePass(
  player: Sampler,
  notes: Note[],
  bpm: number,
  swing: SwingAmount,
  tightStart = false
): SchedulePassResult {
  const schedule = buildSchedule(notes, bpm, swing);
  const start = Tone.now() + (tightStart ? 0.03 : 0.15);

  for (const note of schedule) {
    if (!note.rest) {
      player.triggerAttackRelease(note.pitch, note.duration, start + note.time);
    }
  }

  const totalDuration = scheduleTotalDuration(schedule);
  const durationMs = Math.max(0, (start + totalDuration - Tone.now()) * 1000);

  return { durationMs, startTime: start, schedule, totalDuration };
}

function skipLeadingRests(notes: Note[]): Note[] {
  let i = 0;
  while (i < notes.length && notes[i].rest) {
    i += 1;
  }
  return i === 0 ? notes : notes.slice(i);
}

function notesForLoopCycle(notes: Note[]): Note[] {
  return [...notes, LOOP_REPEAT_REST];
}

export async function playNotes(
  notes: Note[],
  bpm: number,
  onComplete?: () => void,
  swing: SwingAmount = 1,
  loop = false,
  onProgress?: (progress: PlaybackProgress) => void
): Promise<void> {
  stopPlayback();
  loopActive = loop;
  const generation = ++playbackGeneration;

  const player = await ensurePlayer();
  const contentDuration = scheduleTotalDuration(buildSchedule(notes, bpm, swing));
  const leadingSkip = leadingRestDuration(notes, bpm, swing);

  const runPass = (isRepeat = false) => {
    if (generation !== playbackGeneration) return;
    activePlayer()?.releaseAll();
    let cycleNotes = isRepeat ? skipLeadingRests(notes) : notes;
    if (loop) {
      cycleNotes = notesForLoopCycle(cycleNotes);
    }
    const pass = schedulePass(player, cycleNotes, bpm, swing, isRepeat);
    startProgressTracking(
      generation,
      pass.startTime,
      pass.totalDuration,
      contentDuration,
      leadingSkip,
      isRepeat,
      onProgress
    );
    const id = window.setTimeout(() => {
      scheduledIds = scheduledIds.filter((scheduledId) => scheduledId !== id);
      if (generation !== playbackGeneration) return;
      if (loopActive) {
        runPass(true);
      } else {
        cancelProgressTracking();
        onProgress?.({
          elapsed: pass.totalDuration,
          totalDuration: pass.totalDuration,
          contentDuration,
          leadingSkip,
          isRepeat,
        });
        onComplete?.();
      }
    }, pass.durationMs);
    scheduledIds.push(id);
  };

  runPass(false);
}

export function stopPlayback(): void {
  loopActive = false;
  playbackGeneration += 1;
  cancelProgressTracking();
  scheduledIds.forEach((id) => window.clearTimeout(id));
  scheduledIds = [];
  activePlayer()?.releaseAll();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}

export function disposePlayback(): void {
  stopPlayback();
  for (const player of Object.values(players)) {
    player?.dispose();
  }
  for (const key of Object.keys(players) as InstrumentId[]) {
    delete players[key];
    delete loadPromises[key];
  }
  onInterrupted = null;
}
