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
import type { WheelKey } from './keys';
import { compInstrumentForMelody, compVolumeDb } from './comp-instruments';
import { scheduleCompHits } from './comp-schedule';
import { harmonicCompStartQuarters } from './notes';
import { disposeMetronome, scheduleAnacrusisCountIn } from './metronome';

let currentInstrumentId: InstrumentId = 'nylon';
const players: Partial<Record<InstrumentId, Sampler>> = {};
const loadPromises: Partial<Record<InstrumentId, Promise<Sampler>>> = {};
let playbackGeneration = 0;
let progressFrameId = 0;
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

function releaseAllPlayers(): void {
  for (const player of Object.values(players)) {
    player?.releaseAll();
  }
}

export interface BackingOptions {
  key: WheelKey;
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

/** One playback-schedule entry paired with its source note. */
export type ScheduleNoteGroup = {
  entry: ScheduledNote;
  note: Note;
};

export function scheduleNoteGroups(
  notes: Note[],
  bpm: number,
  swing: SwingAmount
): ScheduleNoteGroup[] {
  const schedule = buildSchedule(notes, bpm, swing);
  const groups: ScheduleNoteGroup[] = [];
  const quarter = quarterSeconds(bpm);
  let schedIdx = 0;
  let i = 0;

  while (i < notes.length && schedIdx < schedule.length) {
    const current = notes[i];
    const next = notes[i + 1];

    if (swing > 0 && next && pairFillsQuarter(current, next, bpm, quarter)) {
      groups.push({ entry: schedule[schedIdx++], note: current });
      groups.push({ entry: schedule[schedIdx++], note: next });
      i += 2;
      continue;
    }

    groups.push({ entry: schedule[schedIdx++], note: current });
    i += 1;
  }

  return groups;
}

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
  if (progressFrameId) {
    cancelAnimationFrame(progressFrameId);
    progressFrameId = 0;
  }
  Tone.Draw.cancel(0);
}

function scheduleTotalDuration(schedule: ScheduledNote[]): number {
  return schedule.reduce((max, note) => Math.max(max, note.time + note.duration), 0);
}

export { scheduleTotalDuration };

export interface PlaybackProgress {
  elapsed: number;
  totalDuration: number;
  contentDuration: number;
}

function startProgressTracking(
  generation: number,
  startTime: number,
  totalDuration: number,
  contentDuration: number,
  onProgress?: (progress: PlaybackProgress) => void
): void {
  cancelProgressTracking();
  if (!onProgress || totalDuration <= 0) return;

  const tick = () => {
    if (generation !== playbackGeneration) return;
    const elapsed = Math.max(0, Tone.now() - startTime);
    onProgress({
      elapsed: Math.min(elapsed, totalDuration),
      totalDuration,
      contentDuration,
    });
    if (elapsed < totalDuration) {
      progressFrameId = requestAnimationFrame(tick);
    }
  };

  progressFrameId = requestAnimationFrame(tick);
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
  const leadIn = tightStart ? 0.03 : 0.15;
  const start = Tone.now() + leadIn;

  for (const note of schedule) {
    if (!note.rest) {
      player.triggerAttackRelease(note.pitch, note.duration, start + note.time);
    }
  }

  const totalDuration = scheduleTotalDuration(schedule);

  return { durationMs: (leadIn + totalDuration) * 1000, startTime: start, schedule, totalDuration };
}

function schedulePassEnd(
  generation: number,
  endTime: number,
  onEnd: () => void
): void {
  Tone.Draw.schedule(() => {
    if (generation !== playbackGeneration) return;
    onEnd();
  }, endTime);
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
  onProgress?: (progress: PlaybackProgress) => void,
  backing?: BackingOptions | null
): Promise<void> {
  stopPlayback();
  loopActive = loop;
  const generation = ++playbackGeneration;

  const player = await ensurePlayer();
  player.volume.value = instrumentVolume(currentInstrumentId);

  let compPlayer: Sampler | null = null;
  if (backing) {
    const compId = compInstrumentForMelody(currentInstrumentId);
    compPlayer = await loadInstrument(compId);
    compPlayer.volume.value = compVolumeDb(compId);
  }

  const contentDuration = scheduleTotalDuration(buildSchedule(notes, bpm, swing));
  const harmonicStartQuarters = harmonicCompStartQuarters(notes);

  const runPass = (isRepeat = false) => {
    if (generation !== playbackGeneration) return;
    if (isRepeat) releaseAllPlayers();

    let cycleNotes = notes;
    if (loop) {
      cycleNotes = notesForLoopCycle(cycleNotes);
    }
    const pass = schedulePass(player, cycleNotes, bpm, swing, isRepeat);

    if (harmonicStartQuarters > 0) {
      scheduleAnacrusisCountIn(pass.startTime, bpm, harmonicStartQuarters);
    }

    if (backing && compPlayer) {
      scheduleCompHits(
        compPlayer,
        backing.key,
        bpm,
        swing,
        pass.startTime,
        pass.totalDuration,
        harmonicStartQuarters
      );
    }

    startProgressTracking(
      generation,
      pass.startTime,
      pass.totalDuration,
      contentDuration,
      onProgress
    );

    schedulePassEnd(generation, pass.startTime + pass.totalDuration, () => {
      if (generation !== playbackGeneration) return;
      if (loopActive) {
        runPass(true);
      } else {
        cancelProgressTracking();
        onProgress?.({
          elapsed: pass.totalDuration,
          totalDuration: pass.totalDuration,
          contentDuration,
        });
        onComplete?.();
      }
    });
  };

  runPass(false);
}

export function stopPlayback(): void {
  loopActive = false;
  playbackGeneration += 1;
  cancelProgressTracking();
  releaseAllPlayers();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}

export function disposePlayback(): void {
  stopPlayback();
  disposeMetronome();
  for (const player of Object.values(players)) {
    player?.dispose();
  }
  for (const key of Object.keys(players) as InstrumentId[]) {
    delete players[key];
    delete loadPromises[key];
  }
  onInterrupted = null;
}
