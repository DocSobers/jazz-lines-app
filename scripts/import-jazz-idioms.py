#!/usr/bin/env python3
"""Generate src/data/jazz-idioms.ts from all sheets in jazz_idoms.xlsx."""

from __future__ import annotations

import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / 'jazz_idoms.xlsx'
OUT = ROOT / 'src' / 'data' / 'jazz-idioms.ts'

# Beat lengths in quarter-note units → Tone.js duration
DUR = {
    0.11: '4n * 0.11',
    0.25: '16n',
    0.3: '4n * 0.3',
    0.33: '8t',
    0.5: '8n',
    0.67: '4t',
    1.0: '4n',
    2.0: '2n',
}

SHEET_SECTIONS = {
    'ii-v': 'II-V',
    'v-i': 'V-I',
    'i-maj': 'I-maj',
}

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
RNS = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    shared: list[str] = []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in root.findall('m:si', NS):
        t = si.find('m:t', NS)
        if t is not None and t.text:
            shared.append(t.text)
        else:
            parts = [r.find('m:t', NS).text or '' for r in si.findall('m:r', NS)]
            shared.append(''.join(parts))
    return shared


def read_sheet_rows(z: zipfile.ZipFile, target: str, shared: list[str]) -> list[list[str]]:
    sheet = ET.fromstring(z.read(f'xl/{target}'))
    rows: list[list[str]] = []
    for row in sheet.findall('m:sheetData/m:row', NS)[1:]:
        cells: list[str] = []
        for cell in row.findall('m:c', NS):
            t = cell.get('t')
            v = cell.find('m:v', NS)
            if v is None:
                cells.append('')
            elif t == 's':
                cells.append(shared[int(v.text)])
            else:
                cells.append(v.text)
        rows.append(cells)
    return rows


def parse_workbook(path: Path) -> list[tuple[str, list[list[str]]]]:
    sheets: list[tuple[str, list[list[str]]]] = []
    with zipfile.ZipFile(path) as z:
        shared = load_shared_strings(z)
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rid_to_target = {
            r.get('Id'): r.get('Target')
            for r in rels.findall('r:Relationship', RNS)
        }
        for sheet_el in wb.findall('m:sheets/m:sheet', NS):
            name = sheet_el.get('name', '')
            section = SHEET_SECTIONS.get(name)
            if not section:
                print(f'Skipping unknown sheet: {name}', file=sys.stderr)
                continue
            target = rid_to_target[sheet_el.get(RID)]
            rows = read_sheet_rows(z, target, shared)
            sheets.append((section, rows))
    return sheets


def beats_to_tone(beats: float) -> str:
    if beats in DUR:
        return DUR[beats]
    return f'4n * {beats}'


def parse_phrase(phrase: str) -> list[tuple[bool, str, str]]:
    notes: list[tuple[bool, str, str]] = []
    for part in re.split(r',\s*', phrase.strip()):
        part = part.strip()
        if not part:
            continue
        match = re.match(r'(\S+)\s+([\d.]+)', part)
        if not match:
            raise ValueError(f'Bad phrase part: {part!r}')
        pitch, dur = match.group(1), float(match.group(2))
        notes.append((pitch == 'R', pitch, beats_to_tone(dur)))
    return notes


def fmt_note(rest: bool, pitch: str, duration: str) -> str:
    if rest:
        return f"      {{ rest: true, pitch: 'R', duration: '{duration}' }},"
    return f"      {{ pitch: '{pitch}', duration: '{duration}' }},"


def main() -> None:
    if not XLSX.exists():
        print(f'Missing {XLSX}', file=sys.stderr)
        sys.exit(1)

    workbook = parse_workbook(XLSX)
    lines = [
        "import type { Example } from '../types';",
        '',
        '/** Generated from jazz_idoms.xlsx — run `npm run import-idioms` to refresh. */',
        'export const JAZZ_IDIOMS: Example[] = [',
    ]
    total = 0

    for section, rows in workbook:
        for pattern, filename, _start, phrase, _chords in rows:
            num = pattern.lstrip('#')
            ex_id = filename.replace('#', 'n')
            lines.append('  {')
            lines.append(f"    id: '{ex_id}',")
            lines.append(f"    section: '{section}',")
            lines.append(f"    number: '{num}',")
            lines.append(f"    label: '{section} {pattern}',")
            lines.append('    notes: [')
            for rest, pitch, duration in parse_phrase(phrase):
                lines.append(fmt_note(rest, pitch, duration))
            lines.append('    ],')
            lines.append('  },')
            total += 1

    lines.append('];')
    lines.append('')
    lines.append("export const IDIOM_SECTIONS = ['II-V', 'V-I', 'I-maj'] as const;")
    lines.append('')
    lines.append('/** Suggested ii-V-I progression order */')
    lines.append("export const PROGRESSION = ['II-V', 'V-I', 'I-maj'] as const;")
    lines.append('')
    OUT.write_text('\n'.join(lines))
    print(f'Wrote {total} examples to {OUT}')


if __name__ == '__main__':
    main()
