import * as XLSX from 'xlsx';
import { applyEdits, type ExampleEdits } from './example-edits';
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

function durationToBeats(duration: string): number {
  if (duration in BEATS_BY_DURATION) {
    return BEATS_BY_DURATION[duration];
  }
  const match = duration.match(/^4n \* ([\d.]+)$/);
  if (match) return Number(match[1]);
  return 1;
}

function formatBeats(beats: number): string {
  return String(parseFloat(beats.toFixed(2)));
}

function notesToPhrase(notes: Note[]): string {
  return notes
    .map((note) => {
      const beats = formatBeats(durationToBeats(note.duration));
      if (note.rest) return `R ${beats}`;
      return `${note.pitch} ${beats}`;
    })
    .join(', ');
}

/** idiom_ii_v_n1a → idiom_ii_v_#1a */
export function exampleIdToFilename(id: string): string {
  const marker = id.lastIndexOf('_n');
  if (marker === -1) return id;
  return `${id.slice(0, marker)}_#${id.slice(marker + 2)}`;
}

export async function exportEditsToXlsx(
  baseExamples: Example[],
  edits: ExampleEdits
): Promise<void> {
  if (Object.keys(edits).length === 0) {
    throw new Error('No edits to export.');
  }

  const response = await fetch('/jazz_idoms.xlsx');
  if (!response.ok) {
    throw new Error('Could not load jazz_idoms.xlsx');
  }

  const merged = applyEdits(baseExamples, edits);
  const mergedByFilename = new Map(
    merged.map((ex) => [exampleIdToFilename(ex.id), ex])
  );

  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: '',
    });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const filename = String(row[1] ?? '');
      const example = mergedByFilename.get(filename);
      if (!example || !edits[example.id]) continue;

      row[2] = example.pickupBeat ?? 0;
      row[3] = notesToPhrase(example.notes);
    }

    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rows);
  }

  XLSX.writeFile(workbook, 'jazz_idoms.xlsx');
}
