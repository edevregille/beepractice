import type { Grade, WordEntry } from '../data/words'
import { cancelSpeech, reportSpeechStatus, speak, speakLetters } from './speech'

/**
 * Two ways to say a word: the clips rendered ahead of time by
 * `scripts/generate-audio.mjs`, or the browser's own speech engine.
 *
 * The files exist because the speech engine is not dependable — Chrome on macOS
 * can stop speaking process-wide with no error for the page to catch. They are
 * ON STANDBY right now (see USE_AUDIO_FILES) so we can tell whether the browser
 * engine is working again on its own.
 */

/**
 * false = browser speech only (current, for testing).
 * true  = play the pre-rendered clips in public/audio, falling back to speech.
 *
 * Override for one visit without rebuilding:
 *   ?audio=files    force the clips
 *   ?audio=speech   force the speech engine
 */
const USE_AUDIO_FILES = false

function useFiles(): boolean {
  try {
    const choice = new URLSearchParams(window.location.search).get('audio')
    if (choice === 'files') return true
    if (choice === 'speech') return false
  } catch {
    // Non-browser context; fall through to the constant.
  }
  return USE_AUDIO_FILES
}

/** Must match `slug()` in scripts/generate-audio.mjs. */
export function audioSlug(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const base = import.meta.env.BASE_URL

export function wordSrc(grade: Grade, word: string): string {
  return `${base}audio/g${grade}/word/${audioSlug(word)}.m4a`
}

export function sentenceSrc(grade: Grade, word: string): string {
  return `${base}audio/g${grade}/sentence/${audioSlug(word)}.m4a`
}

export function letterSrc(letter: string): string {
  return `${base}audio/letters/${letter}.m4a`
}

/**
 * How fast to read. Children need words noticeably slower than a browser's
 * default, and the two paths need different numbers to sound the same: the
 * clips are already rendered slow, while the speech engine is not.
 */
export type Pace = 'normal' | 'slow'

const FILE_RATE: Record<Pace, number> = { normal: 1, slow: 0.7 }
const SPEECH_RATE: Record<Pace, number> = { normal: 0.8, slow: 0.55 }

let current: HTMLAudioElement | null = null
let generation = 0

/** Stops whatever is playing, files and live speech alike. */
export function stopAudio(): void {
  generation += 1
  if (current) {
    current.pause()
    current = null
  }
  cancelSpeech()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function playFile(src: string, rate: number, token: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.playbackRate = rate
    // Keep the voice from turning chipmunky when slowed down.
    const pitched = audio as HTMLAudioElement & { preservesPitch?: boolean }
    if ('preservesPitch' in pitched) pitched.preservesPitch = true

    current = audio
    audio.onended = () => {
      if (current === audio) current = null
      resolve()
    }
    audio.onerror = () => reject(new Error(`could not play ${src}`))
    audio.play().catch(reject)

    // A stop() or a newer request supersedes this one.
    const check = window.setInterval(() => {
      if (token !== generation) {
        window.clearInterval(check)
        audio.pause()
        resolve()
      } else if (audio.ended || current !== audio) {
        window.clearInterval(check)
      }
    }, 120)
  })
}

async function playOrSpeak(src: string, spoken: string, pace: Pace): Promise<void> {
  stopAudio()
  if (!useFiles()) {
    speak(spoken, SPEECH_RATE[pace])
    return
  }
  const token = generation
  try {
    await playFile(src, FILE_RATE[pace], token)
    if (token === generation) reportSpeechStatus(true)
  } catch {
    // No file (a word added without regenerating audio) or playback refused.
    speak(spoken, SPEECH_RATE[pace])
  }
}

export function playWord(grade: Grade, entry: WordEntry, pace: Pace = 'normal'): Promise<void> {
  return playOrSpeak(wordSrc(grade, entry.word), entry.word, pace)
}

export function playSentence(grade: Grade, entry: WordEntry, pace: Pace = 'normal'): Promise<void> {
  if (!entry.sentence) return playWord(grade, entry, pace)
  return playOrSpeak(sentenceSrc(grade, entry.word), entry.sentence, pace)
}

/** Reads a word out one letter at a time, for "Show me and move on". */
export async function spellOutWord(word: string, gap = 130): Promise<void> {
  stopAudio()
  if (!useFiles()) {
    speakLetters(word)
    return
  }
  const token = generation
  const letters = audioSlug(word).replace(/[^a-z]/g, '').split('')
  try {
    for (const letter of letters) {
      if (token !== generation) return
      await playFile(letterSrc(letter), FILE_RATE.normal, token)
      await delay(gap)
    }
    if (token === generation) reportSpeechStatus(true)
  } catch {
    speakLetters(word)
  }
}

// Holding the elements keeps them from being collected before they finish loading.
const warm: HTMLAudioElement[] = []
const WARM_LIMIT = 3

/**
 * Warms the clips for the next word or two. Deliberately not the whole round:
 * a browser only opens a handful of connections per host, and a pile of eager
 * preloads can queue ahead of the clip the child is waiting on right now.
 */
export function preloadWords(grade: Grade, entries: WordEntry[]): void {
  if (!useFiles()) return
  for (const entry of entries.slice(0, WARM_LIMIT)) {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = wordSrc(grade, entry.word)
    warm.push(audio)
  }
  while (warm.length > WARM_LIMIT) warm.shift()
}
