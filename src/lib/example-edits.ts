import type { Example, Note } from '../types';

const STORAGE_KEY = 'jazz-lines-example-edits';

export interface ExampleEdit {
  notes: Note[];
  pickupBeat?: number;
}

export type ExampleEdits = Record<string, ExampleEdit>;

export function loadEdits(): ExampleEdits {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ExampleEdits;
  } catch {
    return {};
  }
}

export function persistEdits(edits: ExampleEdits): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
}

export function applyEdits(examples: Example[], edits: ExampleEdits): Example[] {
  return examples.map((ex) => {
    const edit = edits[ex.id];
    if (!edit) return ex;
    return {
      ...ex,
      notes: edit.notes,
      pickupBeat: edit.pickupBeat ?? ex.pickupBeat,
    };
  });
}

export function mergeExample(example: Example, edits: ExampleEdits): Example {
  const edit = edits[example.id];
  if (!edit) return example;
  return {
    ...example,
    notes: edit.notes,
    pickupBeat: edit.pickupBeat ?? example.pickupBeat,
  };
}
