import { wordsForGrade, type Grade, type WordEntry } from '../data/words'
import type { Profile } from './storage'

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Picks the words for one round: previously missed words first, then words
 * that have never been mastered, then mastered words to top up.
 */
export function buildSession(profile: Profile, grade: Grade, length: number): WordEntry[] {
  const all = wordsForGrade(grade)
  const progress = profile.grades[grade]
  const mastered = new Set(progress.mastered)

  const missed = shuffle(all.filter((w) => (progress.missed[w.word] ?? 0) > 0 && !mastered.has(w.word)))
  const fresh = shuffle(all.filter((w) => !mastered.has(w.word) && (progress.missed[w.word] ?? 0) === 0))
  const review = shuffle(all.filter((w) => mastered.has(w.word)))

  const picked: WordEntry[] = []
  for (const bucket of [missed, fresh, review]) {
    for (const w of bucket) {
      if (picked.length >= length) break
      picked.push(w)
    }
  }
  return shuffle(picked)
}

export function sessionLengths(grade: Grade): number[] {
  const total = wordsForGrade(grade).length
  return [5, 10, 15, 20].filter((n) => n <= Math.max(total, 5))
}

/** The youngest grades start on a short round — ten words is a long sit at six. */
export function defaultSessionLength(grade: Grade): number {
  return grade <= 2 ? 5 : 10
}
