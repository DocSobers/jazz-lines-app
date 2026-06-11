import {
  Beam,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from 'vexflow';
import type { Example, Note } from '../types';

const BEATS_BY_DURATION: Record<string, number> = {
  '8t': 0.33,
  '4t': 0.67,
  '4n': 1,
  '8n': 0.5,
  '16n': 0.25,
  '2n': 2,
  '4n * 0.11': 0.11,
  '4n * 0.25': 0.25,
  '4n * 0.3': 0.3,
};

const MEASURE_BEATS = 4;
const STAVE_WIDTH = 260;
const STAVE_X = 16;
const STAVE_Y = 48;
/** Matches `--text` in dark mode */
const STAFF_INK = '#e8edf4';

const staffInkStyle = {
  fillStyle: STAFF_INK,
  strokeStyle: STAFF_INK,
};

function applyInkToTickables(tickables: StaveNote[]): void {
  tickables.forEach((tickable) => {
    tickable.setStyle(staffInkStyle);
    tickable.setStemStyle(staffInkStyle);
    tickable.setFlagStyle(staffInkStyle);
    tickable.setLedgerLineStyle(staffInkStyle);
  });
}

function durationToBeats(duration: string): number {
  if (duration in BEATS_BY_DURATION) {
    return BEATS_BY_DURATION[duration];
  }
  const match = duration.match(/^4n \* ([\d.]+)$/);
  if (match) return Number(match[1]);
  return 1;
}

function pitchToVexKey(pitch: string): string {
  const match = pitch.match(/^([A-G](?:#|b)?)(-?\d+)$/);
  if (!match) return 'c/4';
  return `${match[1]}/${match[2]}`;
}

type RestChunk = {
  beats: number;
  duration: string;
  dots?: number;
};

const REST_CHUNKS: RestChunk[] = [
  { beats: 4, duration: 'w' },
  { beats: 3, duration: '2', dots: 1 },
  { beats: 2, duration: '2' },
  { beats: 1.5, duration: '4', dots: 1 },
  { beats: 1, duration: '4' },
  { beats: 0.5, duration: '8' },
  { beats: 0.25, duration: '16' },
];

/** Written beat value for staff layout (swung 4t/8t → eighth notes). */
function noteWrittenBeats(note: Note): number {
  if (note.rest) return durationToBeats(note.duration);
  if (note.duration === '4t' || note.duration === '8t') return 0.5;
  return durationToBeats(note.duration);
}

function createRestNote(duration: string, dots = 0): StaveNote {
  return new StaveNote({
    keys: ['b/4'],
    duration: `${duration}r`,
    dots,
  });
}

function restBeatsToNotes(beats: number): StaveNote[] {
  const notes: StaveNote[] = [];
  let remaining = beats;

  while (remaining > 0.005) {
    const chunk =
      REST_CHUNKS.find((part) => part.beats <= remaining + 0.02) ??
      REST_CHUNKS[REST_CHUNKS.length - 1];
    notes.push(createRestNote(chunk.duration, chunk.dots));
    remaining -= chunk.beats;
  }

  return notes;
}

/** Jazz lead-sheet style: swung 4t/8t pairs are written as beamed eighth notes. */
function mapDurationToVex(duration: string): string {
  switch (duration) {
    case '2n':
      return '2';
    case '4n':
      return '4';
    case '8n':
    case '4t':
    case '8t':
      return '8';
    case '16n':
      return '16';
    default:
      return '4';
  }
}

function noteToStaveNotes(note: Note): StaveNote[] {
  if (note.rest) {
    const custom = note.duration.match(/^4n \* ([\d.]+)$/);
    if (custom) return restBeatsToNotes(Number(custom[1]));
    return [createRestNote(mapDurationToVex(note.duration))];
  }

  return [
    new StaveNote({
      keys: [pitchToVexKey(note.pitch)],
      duration: mapDurationToVex(note.duration),
      autoStem: true,
    }),
  ];
}

/** Notes that complete the pickup/anacrusis measure (actual beat time). */
function pickupMeasureNotes(notes: Note[], pickupBeat: number): Note[] {
  const barNotes: Note[] = [];
  let actualBeats = pickupBeat;

  for (const note of notes) {
    const beats = durationToBeats(note.duration);
    if (barNotes.length > 0 && actualBeats + beats > MEASURE_BEATS + 0.02) break;
    barNotes.push(note);
    actualBeats += beats;
    if (actualBeats >= MEASURE_BEATS - 0.02) break;
  }

  return barNotes;
}

function restForWrittenBeats(beats: number): Note {
  return { rest: true, pitch: 'R', duration: `4n * ${beats}` };
}

function buildPickupMeasure(notes: Note[], pickupBeat: number): Note[] {
  const barNotes = pickupMeasureNotes(notes, pickupBeat);
  const writtenSounding = barNotes.reduce((sum, note) => sum + noteWrittenBeats(note), 0);
  const writtenRest = MEASURE_BEATS - writtenSounding;
  return [restForWrittenBeats(writtenRest), ...barNotes];
}

function splitRemainingMeasures(notes: Note[]): Note[][] {
  if (notes.length === 0) return [];

  const totalActual = notes.reduce((sum, note) => sum + durationToBeats(note.duration), 0);
  if (totalActual <= MEASURE_BEATS + 0.02) return [notes];

  const measures: Note[][] = [];
  let current: Note[] = [];
  let beats = 0;

  for (const note of notes) {
    const noteBeats = durationToBeats(note.duration);

    if (beats > 0 && beats + noteBeats > MEASURE_BEATS + 0.02) {
      measures.push(current);
      current = [];
      beats = 0;
    }

    current.push(note);
    beats += noteBeats;

    if (beats >= MEASURE_BEATS - 0.02) {
      measures.push(current);
      current = [];
      beats = 0;
    }
  }

  if (current.length > 0) measures.push(current);
  return measures;
}

function buildStaffMeasures(example: Example): Note[][] {
  const { notes, pickupBeat } = example;
  if (notes.length === 0) return [[]];

  if (pickupBeat && pickupBeat > 0) {
    const pickupBar = buildPickupMeasure(notes, pickupBeat);
    const consumed = pickupMeasureNotes(notes, pickupBeat).length;
    return [pickupBar, ...splitRemainingMeasures(notes.slice(consumed))];
  }

  return splitRemainingMeasures(notes);
}

function measureToTickables(measureNotes: Note[]): StaveNote[] {
  return measureNotes.flatMap((note) => noteToStaveNotes(note));
}

export function renderExampleStaff(container: HTMLDivElement, example: Example): void {
  container.replaceChildren();

  const measures = buildStaffMeasures(example);
  const width = Math.max(320, STAVE_X * 2 + measures.length * STAVE_WIDTH);
  const height = 160;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();
  context.setFillStyle(STAFF_INK);
  context.setStrokeStyle(STAFF_INK);

  measures.forEach((measureNotes, index) => {
    const tickables = measureToTickables(measureNotes);
    if (tickables.length === 0) return;

    applyInkToTickables(tickables);

    const stave = new Stave(STAVE_X + index * STAVE_WIDTH, STAVE_Y, STAVE_WIDTH - 20);
    stave.setStyle(staffInkStyle);
    if (index === 0) {
      stave.addClef('treble').addTimeSignature('4/4');
    }
    stave.setContext(context).draw();

    const voice = new Voice({ numBeats: MEASURE_BEATS, beatValue: 4 });
    voice.setMode(Voice.Mode.SOFT);
    voice.addTickables(tickables);

    context.setFillStyle(STAFF_INK);
    context.setStrokeStyle(STAFF_INK);
    new Formatter().joinVoices([voice]).formatToStave([voice], stave);

    const beams = Beam.generateBeams(tickables, {
      beamRests: false,
      beamMiddleOnly: true,
    });
    beams.forEach((beam) => beam.setStyle(staffInkStyle));

    voice.draw(context, stave);
    beams.forEach((beam) => beam.setContext(context).draw());
  });
}
