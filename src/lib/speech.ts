/* Text-to-speech and letter-by-letter speech recognition, both browser-native. */

/* ---------------------------------------------------------------- speaking */

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

const GOOD_VOICES = /samantha|google us english|google uk english|karen|moira|aaron|allison|ava|joelle|nicky|zoe|daniel|alex\b/i

let cached: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported) return null
  if (cached) return cached
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'))
  cached =
    english.find((v) => GOOD_VOICES.test(v.name)) ??
    english.find((v) => v.lang.toLowerCase() === 'en-us' && v.localService) ??
    english.find((v) => v.lang.toLowerCase() === 'en-us') ??
    english[0] ??
    null
  return cached
}

if (ttsSupported) {
  // Voices load asynchronously in Chrome; drop the cache when the list changes.
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cached = null
    pickVoice()
  })
}

let primed = false
let pending: SpeechSynthesisUtterance | null = null
let watchdog: number | null = null
let statusListener: ((ok: boolean) => void) | null = null

/** Lets the UI say something when a word never actually reaches the speakers. */
export function setSpeechStatusListener(fn: ((ok: boolean) => void) | null): void {
  statusListener = fn
}

/** Also used by the audio-file player, which shares this status channel. */
export function reportSpeechStatus(ok: boolean): void {
  statusListener?.(ok)
}

function clearWatchdog(): void {
  if (watchdog !== null) {
    window.clearTimeout(watchdog)
    watchdog = null
  }
}

export function cancelSpeech(): void {
  if (!ttsSupported) return
  clearWatchdog()
  pending = null
  window.speechSynthesis.cancel()
}

/**
 * Speaks `text`.
 *
 * Chrome can drop an utterance when `speak()` follows `cancel()` in the same
 * tick, so we let the engine settle in between. If a word still never starts we
 * retry once and then tell the UI, because a word that silently fails to play
 * leaves a child staring at a button that appears to do nothing.
 *
 * Browsers do not start speech in a hidden tab — that is expected, not a
 * failure, so the checks are skipped while the page is not visible.
 */
export function speak(text: string, rate = 0.95): void {
  if (!ttsSupported || !text.trim()) return
  const synth = window.speechSynthesis
  clearWatchdog()

  const attempt = (isRetry: boolean) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.pitch = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    let started = false
    utterance.onstart = () => {
      started = true
      clearWatchdog()
      statusListener?.(true)
    }
    utterance.onend = () => {
      if (pending === utterance) pending = null
    }
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return
      clearWatchdog()
      statusListener?.(false)
    }

    pending = utterance
    synth.resume() // Chrome can be left paused after a cancel.
    synth.speak(utterance)

    if (document.visibilityState !== 'visible') return

    watchdog = window.setTimeout(
      () => {
        if (started || pending !== utterance) return
        if (isRetry) {
          statusListener?.(false)
          return
        }
        synth.cancel()
        window.setTimeout(() => {
          if (pending === utterance) attempt(true)
        }, 80)
      },
      isRetry ? 1200 : 500,
    )
  }

  if (synth.speaking || synth.pending) {
    synth.cancel()
    window.setTimeout(() => attempt(false), 90)
  } else {
    attempt(false)
  }
}

/** Reads a word one letter at a time, e.g. for "Show me". */
export function speakLetters(word: string, rate = 0.7): void {
  speak(word.split('').join(', '), rate)
}

/**
 * iOS and Chrome only allow speech after a user gesture, so call this from a tap
 * handler once per session. It speaks a very short silent utterance rather than
 * a blank one — some engines never finish a whitespace-only utterance, which
 * then blocks everything queued behind it.
 */
export function primeSpeech(): void {
  if (!ttsSupported || primed) return
  primed = true
  pickVoice()
  const utterance = new SpeechSynthesisUtterance('a')
  utterance.volume = 0
  utterance.rate = 2
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
}

/* ------------------------------------------------------------- recognition */

type RecognitionCtor = new () => SpeechRecognitionInstance

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionResultEventLike = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, RecognitionCtor | undefined>
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const voiceSupported = recognitionCtor() !== null

/* --------------------------------------------------------- letter parsing */

const LETTER_WORDS: Record<string, string> = {}
const SPOKEN: Record<string, string[]> = {
  a: ['a', 'ay', 'eh', 'ai'],
  b: ['b', 'be', 'bee', 'bea'],
  c: ['c', 'see', 'sea', 'cee', 'si'],
  d: ['d', 'de', 'dee'],
  e: ['e', 'ee', 'eee'],
  f: ['f', 'ef', 'eff'],
  g: ['g', 'gee', 'jee'],
  h: ['h', 'aitch', 'haitch', 'ache', 'aich'],
  i: ['i', 'eye', 'aye'],
  j: ['j', 'jay', 'jae'],
  k: ['k', 'kay', 'ka', 'kaye'],
  l: ['l', 'el', 'ell', 'elle'],
  m: ['m', 'em', 'emm'],
  n: ['n', 'en', 'enn'],
  o: ['o', 'oh', 'owe', 'ohh'],
  p: ['p', 'pe', 'pee', 'pea'],
  q: ['q', 'cue', 'queue', 'kyu', 'qu'],
  r: ['r', 'are', 'ar', 'arr'],
  s: ['s', 'es', 'ess'],
  t: ['t', 'te', 'tee', 'tea'],
  u: ['u', 'you', 'yu', 'ewe'],
  v: ['v', 've', 'vee'],
  w: ['w', 'dubya', 'doubleu', 'doubleyou'],
  x: ['x', 'ex', 'eks'],
  y: ['y', 'why', 'wye'],
  z: ['z', 'ze', 'zee', 'zed'],
}
for (const [letter, spoken] of Object.entries(SPOKEN)) {
  for (const s of spoken) LETTER_WORDS[s] = letter
}

const UNDO_WORDS = new Set(['delete', 'undo', 'back', 'backspace', 'oops', 'erase', 'remove'])
const SUBMIT_WORDS = new Set(['done', 'check', 'finished', 'finish', 'submit', 'enter'])
const CLEAR_WORDS = new Set(['clear', 'restart', 'reset'])

export type SpellToken =
  | { type: 'letter'; letter: string }
  | { type: 'undo' }
  | { type: 'submit' }
  | { type: 'clear' }
  | { type: 'unknown'; text: string }

/**
 * Turns a spoken phrase into spelling tokens. `target` is used only to reject
 * the case where the student says the whole word instead of spelling it.
 */
export function parseSpelling(transcript: string, target?: string): SpellToken[] {
  const cleaned = transcript
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return []

  const words = cleaned.split(' ')
  const tokens: SpellToken[] = []

  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[-']/g, '')
    if (!w) continue

    // "double u" / "double you" -> w
    if (w === 'double' && i + 1 < words.length && ['u', 'you', 'yu'].includes(words[i + 1])) {
      tokens.push({ type: 'letter', letter: 'w' })
      i += 1
      continue
    }
    if (w === 'start' && words[i + 1] === 'over') {
      tokens.push({ type: 'clear' })
      i += 1
      continue
    }

    const letter = LETTER_WORDS[w]
    if (letter) {
      tokens.push({ type: 'letter', letter })
      continue
    }
    if (UNDO_WORDS.has(w)) {
      tokens.push({ type: 'undo' })
      continue
    }
    if (SUBMIT_WORDS.has(w)) {
      tokens.push({ type: 'submit' })
      continue
    }
    if (CLEAR_WORDS.has(w)) {
      tokens.push({ type: 'clear' })
      continue
    }

    // Fast spelling often comes back merged, e.g. "rhy" for r-h-y. Expand it,
    // unless it is the whole target word — that means the word was said, not spelt.
    if (/^[a-z]{2,4}$/.test(w) && w !== target?.toLowerCase()) {
      for (const ch of w) tokens.push({ type: 'letter', letter: ch })
      continue
    }

    tokens.push({ type: 'unknown', text: w })
  }

  return tokens
}

/* ---------------------------------------------------------- the recognizer */

export type RecognizerHandlers = {
  onTokens: (tokens: SpellToken[]) => void
  onInterim?: (text: string) => void
  onStateChange?: (state: 'listening' | 'idle') => void
  onError?: (error: string) => void
}

export type Recognizer = {
  start: () => void
  stop: () => void
  destroy: () => void
}

export function createRecognizer(getTarget: () => string, handlers: RecognizerHandlers): Recognizer | null {
  const Ctor = recognitionCtor()
  if (!Ctor) return null

  const recognition = new Ctor()
  recognition.lang = 'en-US'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let wanted = false
  let running = false

  recognition.onstart = () => {
    running = true
    handlers.onStateChange?.('listening')
  }

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const text = result[0].transcript
      if (result.isFinal) {
        const tokens = parseSpelling(text, getTarget())
        if (tokens.length) handlers.onTokens(tokens)
        handlers.onInterim?.('')
      } else {
        handlers.onInterim?.(text)
      }
    }
  }

  recognition.onerror = (event) => {
    // "no-speech" and "aborted" are routine on mobile; only surface real problems.
    if (event.error === 'no-speech' || event.error === 'aborted') return
    handlers.onError?.(event.error)
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') wanted = false
  }

  recognition.onend = () => {
    running = false
    handlers.onStateChange?.('idle')
    // Browsers cut the stream every few seconds — restart while we still want it.
    if (wanted) {
      setTimeout(() => {
        if (wanted && !running) {
          try {
            recognition.start()
          } catch {
            /* already starting */
          }
        }
      }, 250)
    }
  }

  return {
    start() {
      wanted = true
      if (running) return
      try {
        recognition.start()
      } catch {
        /* start() throws if it is already running */
      }
    },
    stop() {
      wanted = false
      try {
        recognition.stop()
      } catch {
        /* not running */
      }
    },
    destroy() {
      wanted = false
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.onstart = null
      try {
        recognition.abort()
      } catch {
        /* not running */
      }
    },
  }
}
