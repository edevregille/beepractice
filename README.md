# BeePractice

Spelling and typing practice for grades 3-6. A kid hears a word, then either
types it or spells it out loud letter by letter, and earns points, streaks and
stars. Mobile-first React, no backend — every student's progress lives in the
browser's `localStorage`.

## Running it

Needs Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, then production build into dist/
npm run preview    # serve the built dist/ locally
npm run typecheck  # tsc -b, no build
```

There is no backend, no database and no API keys — it is a static site.

## Deploying to Vercel

It is a static Vite build, so no configuration is needed beyond the defaults:

```bash
npx vercel        # preview
npx vercel --prod # production
```

Vercel detects Vite automatically (build `npm run build`, output `dist`).
`vercel.json` rewrites all paths to `/` so a refresh never 404s.

## Editing the word lists

Everything lives in `src/data/words.ts`:

```ts
export const WORD_LISTS: Record<Grade, WordEntry[]> = {
  3: [{ word: 'illness', sentence: 'She missed school because of an illness.' }],
  ...
}
```

- `word` — what the student must spell. Capitalisation and accents are stored as
  written but ignored when checking, so `December` and `piñata` work as expected.
- `sentence` — optional; feeds the "In a sentence" button.
- `accepts` — optional list of other spellings that also count as correct
  (`fertilizer` accepts `fertiliser`).

Adding, removing or reordering words needs no other change. Session length
options adapt to the list size.

## How the game works

- **Points** — 15 for a word spelled right first try, 8 if it took another go,
  0 if revealed.
- **Streak bonus** — +10 at 3 in a row, +15 at 5, +20 at 8. A wrong answer
  resets the streak.
- **Stars** — first-try accuracy over the round: 90% = 3, 70% = 2, 50% = 1.
- **Mastery** — a word counts as mastered after two first-try correct answers,
  and drops back out if it is later missed. New rounds put previously missed
  words first, then unmastered words, then mastered ones.

## Audio

There are two ways the app can say a word, and a single switch chooses between
them: `USE_AUDIO_FILES` at the top of `src/lib/audio.ts`.

| mode | what plays | reliability |
| --- | --- | --- |
| `false` (**current**) | the browser's `speechSynthesis` | depends on the browser's speech engine |
| `true` | pre-rendered clips from `public/audio`, falling back to speech | works wherever `<audio>` works |

**The clips are on standby right now** — the app runs on the browser's speech
engine, and `public/audio/` is gitignored so the clips are a local-only artifact.
Nothing was deleted. To switch back: regenerate the clips (below), flip the
constant to `true`, and drop `public/audio/` from `.gitignore` so deploys get
them.

To try the other mode for one visit without rebuilding:

```
?audio=speech   force the browser speech engine
?audio=files    force the pre-rendered clips
```

### Why the clips exist

Chrome on macOS can stop speaking process-wide: it accepts an utterance, never
plays it, and fires no error the page can catch. The same hang takes out
`<audio>` playback too, because both go through Chrome's audio service process —
fully quitting Chrome is the only cure. A silent button is fatal for an app whose
whole point is "hear the word", so the clips remove that dependency.

### Regenerating the clips

macOS only — it uses the built-in `say` and `afconvert`:

```bash
node scripts/generate-audio.mjs          # renders only what is missing
node scripts/generate-audio.mjs --force  # rebuild every clip
```

426 clips, ~4.6 MB. **They are gitignored**, so a fresh clone has none — run the
command above on a Mac to produce them. Nothing breaks without them: a word with
no clip falls back to live speech automatically, which is also what a deploy does
today. "Say it slower" reuses the same file via `playbackRate`, and "Show me"
plays the letter clips in sequence.

## Voice mode

Uses the browser's `SpeechRecognition` (Chrome, Edge, Safari) for letter-by-letter
spelling. The recogniser maps spoken letter names to letters
(`"see"` → `c`, `"double u"` → `w`) and
understands `delete`, `undo`, `clear` and `done`. It also expands runs that come
back merged (`"rhy"` → `r`, `h`, `y`), but rejects the target word itself so the
student cannot just say the word.

Where recognition is unavailable the mode is disabled on the picker; if the
microphone is blocked mid-round the screen falls back to typing.

## Browser support and known limits

- **Typing mode** works anywhere. It is the default and needs nothing but audio
  playback.
- **Voice mode** needs `SpeechRecognition` — Chrome, Edge and Safari. Firefox
  does not have it, so the mode is disabled on the picker there rather than
  failing later.
- **Progress is per device and per browser.** It is `localStorage`, so a student
  who switches from the iPad to a laptop starts from zero. Several students can
  share one device; each name gets its own profile.
- **If a word will not play**, open `/sound-check.html` on the device. It runs a
  Web Audio beep and six speech-synthesis variants and prints what happened,
  which separates "audio output is broken", "this browser's speech engine is
  dead" and "the app picked the wrong file". Chrome's audio service can hang
  process-wide, which kills both `<audio>` playback and speech with no error
  anywhere; fully quitting Chrome fixes it.

## Layout

```
scripts/
  generate-audio.mjs   renders public/audio from the word lists (macOS)
src/
  data/words.ts        the grade word lists + matching helpers
  lib/audio.ts         plays the pre-rendered clips, falls back to live speech
  lib/speech.ts        fallback text-to-speech, letter recognition and parsing
  lib/storage.ts       localStorage profiles, mastery, day streaks
  lib/scoring.ts       points, streak bonuses, stars
  lib/session.ts       which words a round picks
  components/          icons and shared UI (hexagons, pills, honeycomb)
  screens/             name, grade, mode, practice, results, progress
public/
  audio/               the generated clips (committed)
  sound-check.html     standalone audio diagnostic page
```

## If you turn the clips back on

`public/audio/` is gitignored today, which is fine while the app uses the speech
engine. Before relying on the clips in production, remember that they have to
reach the deploy: Vercel builds on Linux and the generator needs macOS's `say`,
so they cannot be built during the deploy. Either commit them (drop the ignore
rule) or upload them as static assets — otherwise every deployed word silently
falls back to live speech, which is the failure mode the clips exist to avoid.
