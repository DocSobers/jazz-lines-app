import type { Note } from '../types';
import { tickableCountForNote } from './notation';
import { buildSchedule, scheduleNoteGroups, scheduleTotalDuration } from './playback';

export interface StaffPlayheadSlot {
  x: number;
  time: number;
}

export interface StaffPlayheadLayout {
  slots: StaffPlayheadSlot[];
  top: number;
  height: number;
  contentDuration: number;
}

function scheduleContentDuration(notes: Note[], bpm: number, swing: number): number {
  return scheduleTotalDuration(buildSchedule(notes, bpm, swing));
}

/** Evenly map staff x positions across [0, contentDuration] when glyph count drifts. */
function attachSlotTimesByX(
  slots: { x: number }[],
  contentDuration: number
): StaffPlayheadSlot[] {
  if (slots.length === 0) return [];
  const minX = slots[0].x;
  const maxX = slots[slots.length - 1].x;
  const span = maxX - minX;

  return slots.map((slot) => ({
    x: slot.x,
    time: span <= 0 ? 0 : ((slot.x - minX) / span) * contentDuration,
  }));
}

/** Pair staff symbol x positions with audio times from the playback schedule. */
export function attachSlotTimes(
  slots: { x: number }[],
  notes: Note[],
  bpm: number,
  swing: number
): { slots: StaffPlayheadSlot[]; contentDuration: number } {
  const contentDuration = scheduleContentDuration(notes, bpm, swing);
  if (slots.length === 0 || contentDuration <= 0) {
    return { slots: [], contentDuration };
  }

  const groups = scheduleNoteGroups(notes, bpm, swing);
  const expectedSlots = groups.reduce((sum, group) => sum + tickableCountForNote(group.note), 0);
  if (expectedSlots !== slots.length) {
    return { slots: attachSlotTimesByX(slots, contentDuration), contentDuration };
  }

  const timed: StaffPlayheadSlot[] = [];
  let slotIdx = 0;

  for (const { entry, note } of groups) {
    const count = tickableCountForNote(note);
    for (let k = 0; k < count; k++) {
      const frac = count === 1 ? 0.5 : k / (count - 1);
      const time = entry.time + frac * entry.duration;
      timed.push({ x: slots[slotIdx].x, time });
      slotIdx++;
    }
  }

  const lastX = timed[timed.length - 1]?.x ?? slots[slots.length - 1].x;
  timed.push({ x: lastX, time: contentDuration });

  return { slots: timed, contentDuration };
}

/** Map playback elapsed seconds to staff position; hold at end during loop gap. */
export function staffPlayheadElapsed(
  elapsed: number,
  contentDuration: number,
  loop: boolean,
  totalDuration: number
): number {
  if (contentDuration <= 0) return 0;
  if (!loop) return Math.min(Math.max(0, elapsed), contentDuration);
  if (elapsed < contentDuration) return elapsed;
  if (elapsed < totalDuration) return contentDuration;
  return 0;
}

/** Interpolate playhead x from timed staff slots. */
export function playheadX(layout: StaffPlayheadLayout, elapsed: number): number {
  const { slots } = layout;
  if (slots.length === 0) return 0;

  const time = Math.max(0, elapsed);
  if (time <= slots[0].time) return slots[0].x;

  const last = slots[slots.length - 1];
  if (time >= last.time) return last.x;

  for (let i = 0; i < slots.length - 1; i++) {
    const a = slots[i];
    const b = slots[i + 1];
    if (time >= a.time && time <= b.time) {
      const span = b.time - a.time;
      const frac = span > 0 ? (time - a.time) / span : 0;
      return a.x + frac * (b.x - a.x);
    }
  }

  return last.x;
}
