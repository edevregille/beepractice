import type { Grade } from '../data/words'
import type { WordResult } from './storage'

export type Mode = 'type' | 'voice'

export type SessionSummary = {
  grade: Grade
  mode: Mode
  results: WordResult[]
  points: number
  bestStreak: number
  stars: number
}
