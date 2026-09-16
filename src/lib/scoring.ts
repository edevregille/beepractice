export const POINTS_FIRST_TRY = 15
export const POINTS_AFTER_RETRY = 8

/** Bonus added on top of the word's points once a streak gets going. */
export function streakBonus(streak: number): number {
  if (streak >= 8) return 20
  if (streak >= 5) return 15
  if (streak >= 3) return 10
  return 0
}

/** The streak length at which the next bonus tier unlocks, if any. */
export function nextStreakTier(streak: number): number | null {
  if (streak < 3) return 3
  if (streak < 5) return 5
  if (streak < 8) return 8
  return null
}

export function starsFor(firstTryCount: number, total: number): number {
  if (total === 0) return 0
  const accuracy = firstTryCount / total
  if (accuracy >= 0.9) return 3
  if (accuracy >= 0.7) return 2
  if (accuracy >= 0.5) return 1
  return 0
}

export const STAR_MESSAGES = [
  'Good start — try that grade again.',
  'Nice work! One more round and you have got it.',
  'Really strong. You are close to perfect.',
  'Brilliant round — nearly every word on the first try!',
]
