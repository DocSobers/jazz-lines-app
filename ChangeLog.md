# Change Log

All notable changes to **Jazz Lines App** since the initial commit and push to GitHub.

**Repository:** https://github.com/DocSobers/jazz-lines-app  
**Production:** https://jazz-lines-app-414082402e4e.herokuapp.com/

### Maintaining this file

After **every git commit**, add an entry under **Change History** (commit hash, title, bullet summary).

After **every Heroku deploy**, add a row under **Heroku Deploy Changelog** (release number, date, deploy hash or config note). Run:

```bash
heroku releases -a jazz-lines-app -n 5
```

Update the *Last updated* line at the bottom. See `.cursor/rules/changelog.mdc` for the full agent workflow.

---

## Change History

Changes are listed in chronological order (oldest first).

### 2026-06-11 — Initial release and core player

#### `2e0d8af` — Initial commit: Jazz Lines Player for ii-V-I idiom practice
- Import idioms from `jazz_idoms.xlsx`.
- Chain phrases across II–V, V–I, and I maj sections.
- Swing playback with octave-aware joins at shared boundary notes.

#### `35c0822` — Fix swing timing and pickup placement for idioms like II-V #1a
- Preserve each beat pair's written long/short ratio instead of always swinging long-first.
- Import `StartTime` from the spreadsheet as `pickupBeat` so pickup notes land on the and of beat 4.

#### `c0f928f` — Add nylon guitar playback, Safari resume fix, and per-idiom octave controls
- Switch from synth to sampled nylon guitar.
- Recover audio after Safari tab backgrounding.
- Per-idiom octave −/+ controls in **Your line** while preserving auto-alignment at zero.

#### `e497d4a` — Add Clerk auth, admin editor/export, and fix guitar sample intonation
- Clerk authentication (sign in / sign up).
- Admin-only idiom editor and XLSX export.
- Browser-persisted idiom edits.
- Repitch mislabeled nylon guitar samples so intervals play correctly.

#### `0c3a2fb` — Add marketing pages, guest demo, key wheel, and pin dev server port
- Landing, About, and Bio routes.
- Guest demo for signed-out users (II–V #1a and #2).
- Chromatic transposition key wheel.
- Line looping.
- Pin Vite dev server to port 5173 (`strictPort`) for stable Clerk redirects.

#### `020e8f3` — Fix demo line register and loop repeat timing
- Preload II–V #1a and #2 as a joined demo line.
- Play idioms in line context with aligned octave joins at shared boundaries.
- Loop with a fixed 1/8-note pause between repeats.

#### `5cf4275` — Add instrument picker, sample caching, Concert C default, and demo footer
- Instrument picker: nylon guitar, flute, or piano.
- Background preload and service-worker MP3 caching.
- Default key wheel to Concert C.
- Center copyright on the guest demo page.

#### `5f3c017` — Add treble clef staff notation and fix demo card playback
- Render idioms as swung eighths on a VexFlow staff with pickup-bar layout.
- Dark-mode ink and beamed stems.
- Restore individual **Play** on in-line demo cards.

#### `b1024f7` — Add color themes, staff playback, and fix concert pitch display
- Five color themes with Slate dark as default.
- **Play** in the notation modal.
- Refined card controls.
- Align staff/MIDI pitches with the spreadsheet at Concert C.

#### `55b4b35` — Add Heroku deployment config for Vite SPA
- `Procfile`, Express static server, and Heroku build settings for production deploy.

#### `d919970` — Redeploy with correct Clerk publishable key
- Fix blank `/app` screen caused by a missing or incorrect `VITE_CLERK_PUBLISHABLE_KEY` on Heroku.

---

### 2026-06-15 — Landing, auth flow, and Your line enhancements

#### `31ac370` — Update landing copy with Mel Bay Publishing and guitarist credits
- Refresh landing page copy with Mel Bay Publishing and guitarist credits.

#### `32e1faa` — Add tooltip on G clef button for music notation window
- Tooltip on the G clef (𝄞) button explaining the music notation window.

#### `badd2b3` — Fix browse idioms link and show clef tooltip above the button
- Route **Browse idioms** to the guest demo for unsigned visitors.
- Custom tooltip above the G clef so it is not clipped by the card.

#### `b80f600` — Lazy-load player routes and scope clef tooltip to the button
- Lazy-load player bundle so the home page stays lightweight.
- Scope G clef hint to a `data-tooltip` pseudo-element on the button itself.

#### `760c5ed` — Add Clerk signup webhook with email notifications to developer
- Replace static-only server with Express.
- `user.created` Clerk webhook emails signup time, username, and approximate location.

#### `4b9e54f` — Redirect users to the player immediately after Clerk sign-up or sign-in
- Centralize auth redirect URLs so new accounts land on `/app` without a separate sign-in step.

#### `0f7a0eb` — Send signed-in users to the full player from Browse idioms
- Guests still open `/app/demo`; authenticated users route to `/app`.

#### `72f6012` — Show start and end notes for each idiom in Your line
- Display transposed start → end pitch names beside each idiom label.

#### `087e7ce` — Add full-line staff view with a G clef button in Your line
- Concatenate chained idioms onto one scrollable staff.
- Larger G clef button in **Your line** opens the full-line notation view.

#### `50c9666` — Let users choose once or both notes at each matching join
- Per-join **Once** / **Both** toggles control whether shared boundary pitches merge or replay (default: Once).

#### `9b21820` — Add a moving playback head on the staff notation view
- Track playback progress against rendered note positions.
- Staff scrolls with a live cursor during idiom or full-line playback.

#### `8d32923` — Add boundary join tooltips and loop control on staff playback
- Hover tooltips explaining **Once** / **Both**.
- **Loop** toggle on staff playback footer (same 1/8-note pause between repeats as **Play line**).

#### `f245453` — Fix staff playhead lag during loop playback
- Sync cursor to the audio clock.
- Offset repeat passes when leading rests are skipped.

#### `9552407` — Add Show all toggle for joinable idioms and hide Add to line when in use
- **Show all** toggle in **Can join next** to browse every idiom.
- Hide **Add to line** for idioms already in the chain.

#### `cbf4070` — Fix Your Line loop stopping after the first measure
- Schedule loop boundaries on the audio clock (`Tone.Draw`).
- Replay the full line each pass instead of skipping pickup rests via `setTimeout`.

#### `0e49cb5` — Fix staff playhead stalling on rests during the first loop pass
- Linear time-based positioning across the staff.
- Wrap elapsed time across loop gaps so the cursor keeps moving on every iteration.

#### `f7d1e3c` — Fix staff playhead finishing early and stalling on first loop pass
- Map playhead timing to the full audio schedule duration instead of the last glyph midpoint.
- Fall back to x-proportional timing when staff glyph count drifts from playback notes.
- Use `requestAnimationFrame` + `Tone.now()` for progress tracking.

#### `baf5dc1` — Add ChangeLog and changelog maintenance rule
- Add `ChangeLog.md` documenting all changes since the initial commit.
- Add Heroku deploy history (v1–v26).
- Add Cursor rule (`.cursor/rules/changelog.mdc`) to update this file after each commit and deploy.
- Follow-up sync commits (`8671bf0`–`d3ffb7b`) established the changelog workflow; meta-entries consolidated in `a45a81b`.

#### `4d5c066` — Simplify ChangeLog footer format to avoid hash churn
- Footer now shows date and Heroku release only (no commit SHA).

#### `76d9622` — Render eighth-note triplets on staff notation with VexFlow tuplets
- Group three consecutive `8t` notes as a triplet with a bracket and “3” (e.g. II-V #6b beat 2).
- Keep swung `4t`+`8t` pairs as beamed eighth notes; handle swing-then-triplet patterns (`4t 8t | 8t 8t 8t`).

#### `903fd06` — Update ChangeLog for 76d9622 and Heroku v27
- Record triplet notation fix and v27 deploy.

### `feature/piano-backing` (in progress — not deployed)

#### `8d3787d` — Start piano backing feature branch with Phase 1 progression model
- Create `feature/piano-backing`; `main` stays production-ready (Heroku v27).
- Add `.cursor/rules/working-branch.mdc` — no merge/deploy from feature branch unless requested.
- Phase 1: `comp-progression.ts` (4-bar ii–V–I in key wheel key), `comp-instruments.ts` (piano comp; nylon when melody is piano).

#### `0b3f88f` — Phase 2–3: piano comp engine and Backing toggle on Play line
- Rootless voicings and medium-swing comp hits on & of 2 and & of 4.
- Dual-sampler playback (melody + comp) synced with loop; 4-bar ii–V–I repeats under the full line.
- **Backing** toggle in transport; comp instrument pairs with melody (piano comp, or guitar when melody is piano).

#### `615ca7a` — Delay ii–V–I comp until after the pickup measure
- When the line opens with a pickup rest (e.g. II-V #3 → #2), hold comp for one bar; first hits land on ii.

#### `f68a670` — Anacrusis count-in metronome; ii comp on & of beat 2
- Click on beats 1–4 during the pickup bar (accent on beat 1).
- First piano comp hit on & of beat 2 of bar 2 (ii), after count-in completes.

#### `71d3585` — Count-in only during pickup rest, not full bar
- Metronome clicks quarter beats until the anacrusis note enters (uses `pickupBeat` rest length).
- Comp unchanged: & of beat 2 on bar 2 (ii).

#### `e73ee5f` — Align anacrusis click with melody; skip beat-4 downbeat gap
- Clicks on beats 1–3 only, then & of beat 4 click synced to exact melody pickup time.
- No downbeat click on beat 4 when pickup follows on the &.

#### `d1a04be` — Jazz bass backing, anacrusis grid sync, and fingered bass tone
- Unified timing grid (`timing.ts`, `anacrusis.ts`) so count-in, melody pickup, comp, and bass share one clock.
- Full beats 1–4 count-in; melody on triplet & of 4 (`pickupBeat` 3.67); comp on triplet & of 2/4 from bar 2.
- Fingered jazz bass on beats 1 & 3 (root / fifth) with `tonejs-instrument-bass-electric-mp3` and warm pizz envelope.

---

## Heroku Deploy Changelog

Production app: **jazz-lines-app**  
URL: https://jazz-lines-app-414082402e4e.herokuapp.com/

| Release | Date (ET) | Type | Description |
|---------|-----------|------|-------------|
| **v1** | 2026-06-11 21:39 | App create | Initial Heroku release |
| **v2** | 2026-06-11 21:39 | Platform | Enable Logplex |
| **v3** | 2026-06-11 21:57 | Config | Set `VITE_CLERK_PUBLISHABLE_KEY` |
| **v4** | 2026-06-11 22:00 | Deploy `55b4b35` | Add Heroku deployment config for Vite SPA |
| **v5** | 2026-06-11 22:34 | Config | Set `VITE_CLERK_PUBLISHABLE_KEY` (corrected key) |
| **v6** | 2026-06-11 22:35 | Deploy `d919970` | Redeploy with correct Clerk publishable key — fixes blank `/app` |
| **v7** | 2026-06-15 07:56 | Deploy `31ac370` | Update landing copy with Mel Bay Publishing and guitarist credits |
| **v8** | 2026-06-15 08:03 | Deploy `32e1faa` | Add tooltip on G clef button for music notation window |
| **v9** | 2026-06-15 08:09 | Deploy `badd2b3` | Fix browse idioms link; clef tooltip above button |
| **v10** | 2026-06-15 08:17 | Deploy `b80f600` | Lazy-load player routes; scope clef tooltip to button |
| **v11** | 2026-06-15 08:25 | Config | Set `NOTIFY_TO` (signup notification recipient) |
| **v12** | 2026-06-15 08:26 | Deploy `760c5ed` | Clerk signup webhook with email notifications |
| **v13** | 2026-06-15 09:52 | Config | Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_FROM` |
| **v14** | 2026-06-15 12:06 | Config | Set `CLERK_WEBHOOK_SECRET` |
| **v15** | 2026-06-15 12:24 | Deploy `4b9e54f` | Auto sign-in redirect after Clerk sign-up or sign-in |
| **v16** | 2026-06-15 12:32 | Deploy `0f7a0eb` | Signed-in **Browse idioms** → `/app`; guests → `/app/demo` |
| **v17** | 2026-06-15 12:43 | Deploy `72f6012` | Show start and end notes in **Your line** |
| **v18** | 2026-06-15 12:49 | Deploy `087e7ce` | Full-line staff view with G clef button in **Your line** |
| **v19** | 2026-06-15 13:01 | Deploy `50c9666` | Per-join **Once** / **Both** boundary note toggles |
| **v20** | 2026-06-15 13:08 | Deploy `9b21820` | Moving playback head on staff notation |
| **v21** | 2026-06-15 13:12 | Deploy `8d32923` | Boundary join tooltips and **Loop** on staff playback |
| **v22** | 2026-06-15 17:05 | Deploy `f245453` | Fix staff playhead lag during loop playback |
| **v23** | 2026-06-15 17:11 | Deploy `9552407` | **Show all** toggle; hide **Add to line** when idiom is in line |
| **v24** | 2026-06-15 17:20 | Deploy `cbf4070` | Fix **Your line** loop stopping after first measure |
| **v25** | 2026-06-15 17:35 | Deploy `0e49cb5` | Fix playhead stalling on rests during first loop pass |
| **v26** | 2026-06-15 17:43 | Deploy `f7d1e3c` | Fix playhead finishing early and stalling on first loop pass |
| **v27** | 2026-06-15 17:52 | Deploy `76d9622` | Render eighth-note triplets on staff notation (e.g. II-V #6b) *(current)* |

### Notes on Heroku releases

- **v1–v3:** App provisioning and initial Clerk key setup before the first successful code deploy.
- **v4–v6:** First production deploys; v6 resolved the blank authenticated player screen.
- **v11–v14:** Config-only releases for signup email notifications (SMTP + Clerk webhook secrets). No application code changed.
- **v12–v26:** Feature and bug-fix deploys aligned with the git commits listed above.
- Commits prior to `55b4b35` (initial player through themes/staff) were developed and pushed to GitHub before Heroku deployment was configured; they shipped together in **v4**.

---

*Last updated: 2026-06-15 (Heroku v27)*
