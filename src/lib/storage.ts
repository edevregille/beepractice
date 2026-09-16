import { GRADES, type Grade } from '../data/words'

const KEY = 'beepractice.v1'

export type GradeProgress = {
  /** Words answered correctly on the first try at least twice. */
  mastered: string[]
  /** How many times each word has been spelled correctly, first try. */
  correct: Record<string, number>
  /** How many times each word has been missed. */
  missed: Record<string, number>
  /** Best star rating earned in a single session (0-3). */
  bestStars: number
  sessions: number
}

export type Profile = {
  name: string
  totalPoints: number
  bestStreak: number
  createdAt: number
  lastPlayedAt: number
  /** ISO yyyy-mm-dd for every day this student practiced. */
  days: string[]
  grades: Record<Grade, GradeProgress>
}

type Store = {
  profiles: Record<string, Profile>
  lastUsed?: string
}

const MASTERY_HITS = 2

function emptyGradeProgress(): GradeProgress {
  return { mastered: [], correct: {}, missed: {}, bestStars: 0, sessions: 0 }
}

function emptyGrades(): Record<Grade, GradeProgress> {
  return GRADES.reduce((acc, g) => {
    acc[g] = emptyGradeProgress()
    return acc
  }, {} as Record<Grade, GradeProgress>)
}

export function profileKey(name: string): string {
  return name.trim().toLowerCase()
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { profiles: {} }
    const parsed = JSON.parse(raw) as Store
    if (!parsed || typeof parsed !== 'object' || !parsed.profiles) return { profiles: {} }
    // Backfill grades added after a profile was created.
    for (const p of Object.values(parsed.profiles)) {
      p.grades = { ...emptyGrades(), ...(p.grades ?? {}) }
      p.days = p.days ?? []
    }
    return parsed
  } catch {
    return { profiles: {} }
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Private mode or full storage — the session still works, it just won't persist.
  }
}

export function listProfiles(): Profile[] {
  const store = readStore()
  return Object.values(store.profiles).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
}

export function lastUsedName(): string | undefined {
  return readStore().lastUsed
}

export function loadProfile(name: string): Profile | undefined {
  return readStore().profiles[profileKey(name)]
}

/** Returns the existing profile for this name, or creates a fresh one. */
export function startProfile(name: string): Profile {
  const store = readStore()
  const key = profileKey(name)
  const now = Date.now()
  const existing = store.profiles[key]
  const profile: Profile = existing
    ? { ...existing, name: name.trim(), lastPlayedAt: now }
    : {
        name: name.trim(),
        totalPoints: 0,
        bestStreak: 0,
        createdAt: now,
        lastPlayedAt: now,
        days: [],
        grades: emptyGrades(),
      }
  store.profiles[key] = profile
  store.lastUsed = name.trim()
  writeStore(store)
  return profile
}

export function saveProfile(profile: Profile): void {
  const store = readStore()
  store.profiles[profileKey(profile.name)] = profile
  store.lastUsed = profile.name
  writeStore(store)
}

export function deleteProfile(name: string): void {
  const store = readStore()
  delete store.profiles[profileKey(name)]
  if (store.lastUsed && profileKey(store.lastUsed) === profileKey(name)) delete store.lastUsed
  writeStore(store)
}

export type WordResult = {
  word: string
  /** Correct with no wrong attempt and no reveal. */
  firstTry: boolean
  /** Got there in the end (possibly after retries). */
  correct: boolean
  attempts: number
}

/** Folds one finished session into the profile and persists it. */
export function applySession(
  profile: Profile,
  grade: Grade,
  results: WordResult[],
  pointsEarned: number,
  bestStreak: number,
  stars: number,
): Profile {
  const g: GradeProgress = {
    ...profile.grades[grade],
    correct: { ...profile.grades[grade].correct },
    missed: { ...profile.grades[grade].missed },
    mastered: [...profile.grades[grade].mastered],
  }

  for (const r of results) {
    if (r.firstTry) {
      g.correct[r.word] = (g.correct[r.word] ?? 0) + 1
      if (g.correct[r.word] >= MASTERY_HITS && !g.mastered.includes(r.word)) {
        g.mastered.push(r.word)
      }
    } else {
      g.missed[r.word] = (g.missed[r.word] ?? 0) + 1
      const i = g.mastered.indexOf(r.word)
      if (i >= 0) g.mastered.splice(i, 1)
    }
  }

  g.sessions += 1
  g.bestStars = Math.max(g.bestStars, stars)

  const today = todayKey()
  const next: Profile = {
    ...profile,
    totalPoints: profile.totalPoints + pointsEarned,
    bestStreak: Math.max(profile.bestStreak, bestStreak),
    lastPlayedAt: Date.now(),
    days: profile.days.includes(today) ? profile.days : [...profile.days, today],
    grades: { ...profile.grades, [grade]: g },
  }
  saveProfile(next)
  return next
}

/** Consecutive days practiced, counting back from today (or yesterday). */
export function dayStreak(profile: Profile): number {
  const days = new Set(profile.days)
  const cursor = new Date()
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
