export interface StaffPlayheadSlot {
  x: number;
}

export interface StaffPlayheadLayout {
  slots: StaffPlayheadSlot[];
  top: number;
  height: number;
}

/** Elapsed time mapped to the written line (wraps during loop gap). */
export function staffPlayheadElapsed(
  elapsed: number,
  contentDuration: number,
  loop: boolean
): number {
  if (contentDuration <= 0) return 0;
  if (loop) return elapsed % contentDuration;
  return Math.min(Math.max(0, elapsed), contentDuration);
}

/** Smooth playhead position proportional to elapsed time across the staff. */
export function playheadX(
  layout: StaffPlayheadLayout,
  elapsed: number,
  contentDuration: number
): number {
  const { slots } = layout;
  if (slots.length === 0 || contentDuration <= 0) return 0;

  const t = Math.min(Math.max(0, elapsed), contentDuration);
  const progress = t / contentDuration;
  const x0 = slots[0].x;
  const x1 = slots[slots.length - 1].x;
  return x0 + progress * (x1 - x0);
}
