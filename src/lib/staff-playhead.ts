import type { ScheduledNote } from './playback';

export interface StaffPlayheadSlot {
  x: number;
}

export interface StaffPlayheadLayout {
  slots: StaffPlayheadSlot[];
  top: number;
  height: number;
}

function slotXForScheduleIndex(
  slots: StaffPlayheadSlot[],
  scheduleLength: number,
  scheduleIndex: number
): number {
  if (slots.length === 0) return 0;
  if (slots.length === 1 || scheduleLength <= 0) return slots[0].x;

  const t = Math.min(1, Math.max(0, scheduleIndex / scheduleLength));
  const pos = t * (slots.length - 1);
  const i = Math.floor(pos);
  const frac = pos - i;
  const x0 = slots[i].x;
  const x1 = slots[Math.min(i + 1, slots.length - 1)].x;
  return x0 + frac * (x1 - x0);
}

/** Map elapsed playback time to an x position on the rendered staff. */
export function playheadX(
  layout: StaffPlayheadLayout,
  schedule: ScheduledNote[],
  elapsed: number
): number {
  const { slots } = layout;
  if (slots.length === 0) return 0;
  if (schedule.length === 0) return slots[0].x;

  const total = schedule.reduce(
    (max, note) => Math.max(max, note.time + note.duration),
    0
  );
  if (elapsed <= 0) return slots[0].x;
  if (elapsed >= total) return slots[slots.length - 1].x;

  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const entryEnd = entry.time + entry.duration;
    if (elapsed > entryEnd && i < schedule.length - 1) continue;

    const frac =
      entry.duration > 0
        ? Math.min(1, Math.max(0, (elapsed - entry.time) / entry.duration))
        : 0;
    const xStart = slotXForScheduleIndex(slots, schedule.length, i);
    const xEnd = slotXForScheduleIndex(slots, schedule.length, i + 1);
    return xStart + frac * (xEnd - xStart);
  }

  return slots[slots.length - 1].x;
}
