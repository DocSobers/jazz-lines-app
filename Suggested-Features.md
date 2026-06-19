# Suggested Features

Backlog items from join-rhythm / demo-line design discussions. Not scheduled — tackle when ready.

## Join & chaining

- **Non-matching boundary pitches** — First-class joins when the prior idiom’s last pitch ≠ the next idiom’s first pitch (voice-leading gaps, suggest by harmony or time grid, not only pitch-class match). Today: **Show all** + manual add + **Entry ±** only.
- **Join suggestions beyond pitch** — Compatible list could consider ii–V–I harmonic slot, duration, or section order—not only `endPitchClass === startPitchClass`.
- **Persist / share chain presets** — Save and recall full chain state including `lineRhythm`, `joinRhythm`, register, entry offset, and octave per row.

## Idiom data & variants

- **Import `rhythmProfile` from spreadsheet** — Tag idioms at import time (`fullTriplet`, `swung`, `mixed`) instead of inferring from note durations in code.
- **Stored upfront variants** — When an alternate is a genuinely different published line (not a mechanical swung↔triplet rewrite), store as separate examples or explicit `variants` on `Example` rather than deriving in code.
- **More demo line variants** — Only V–I #1a has a curated demo swung copy today; document criteria before adding others.

## UX & labeling

- **Chain row tooltips by join shape** — When triplet-at-join applies, show the actual cross-bar figure (e.g. F–B–Ab, F–E–F) in the summary, not a generic label.
- **Staff vs card consistency** — Single-idiom staff always book rhythm; optional “as in current line” preview when an idiom is already chained with a variant.
- **Disable inert controls** — Rhythm/join toggles hidden or disabled when Start = Written or when the idiom is full-triplet (already partially implemented).

## Playback & notation

- **Articulation on short & endings** — Optional tighter release on final swung eighth (e.g. & of 3) without extending the written duration.
- **Cross-bar triplet bracket across segments** — Staff view for full line could span the join bracket across idiom boundaries on one system.

## Backing & form

- **Per-segment harmony when chain spans custom lengths** — Already chain-aware; revisit if non-pitch joins land.
- **Line ending extension scope** — Confirm fermata/extend only when backing is on (implemented); document in UI help.

---

*Last updated: 2026-06-17*
