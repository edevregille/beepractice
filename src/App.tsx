import { useCallback, useState } from 'react'
import type { Grade, WordEntry } from './data/words'
import { NameScreen } from './screens/NameScreen'
import { GradeScreen } from './screens/GradeScreen'
import { ModeScreen } from './screens/ModeScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { buildSession } from './lib/session'
import { primeSpeech } from './lib/speech'
import { applySession, startProfile, type Profile } from './lib/storage'
import type { Mode, SessionSummary } from './lib/types'

type Route =
  | { name: 'name' }
  | { name: 'grade' }
  | { name: 'mode'; grade: Grade }
  | { name: 'practice'; grade: Grade; mode: Mode; length: number; words: WordEntry[] }
  | { name: 'results'; summary: SessionSummary }
  | { name: 'progress'; from: 'grade' | 'results' }

type Tone = 'none' | 'correct' | 'wrong'

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [route, setRoute] = useState<Route>({ name: 'name' })
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null)
  const [tone, setTone] = useState<Tone>('none')

  const handleTone = useCallback((next: Tone) => setTone(next), [])

  function startSession(grade: Grade, mode: Mode, length: number, from: Profile) {
    primeSpeech()
    const words = buildSession(from, grade, length)
    setRoute({ name: 'practice', grade, mode, length, words })
  }

  function finishSession(summary: SessionSummary) {
    if (!profile) return
    const updated = applySession(profile, summary.grade, summary.results, summary.points, summary.bestStreak, summary.stars)
    setProfile(updated)
    setLastSummary(summary)
    setTone('none')
    setRoute({ name: 'results', summary })
  }

  return (
    <div className="app" data-tone={tone}>
      {route.name === 'name' && (
        <NameScreen
          onStart={(name) => {
            setProfile(startProfile(name))
            setRoute({ name: 'grade' })
          }}
        />
      )}

      {route.name === 'grade' && profile && (
        <GradeScreen
          profile={profile}
          onPick={(grade) => setRoute({ name: 'mode', grade })}
          onBack={() => {
            setProfile(null)
            setRoute({ name: 'name' })
          }}
          onProgress={() => setRoute({ name: 'progress', from: 'grade' })}
        />
      )}

      {route.name === 'mode' && profile && (
        <ModeScreen
          grade={route.grade}
          onBack={() => setRoute({ name: 'grade' })}
          onStart={(mode, length) => startSession(route.grade, mode, length, profile)}
        />
      )}

      {route.name === 'practice' && profile && (
        <PracticeScreen
          key={`${route.grade}-${route.mode}-${route.words.length}-${route.words[0]?.word ?? ''}`}
          grade={route.grade}
          mode={route.mode}
          words={route.words}
          onFinish={finishSession}
          onQuit={() => {
            setTone('none')
            setRoute({ name: 'grade' })
          }}
          onTone={handleTone}
        />
      )}

      {route.name === 'results' && profile && (
        <ResultsScreen
          profile={profile}
          summary={route.summary}
          onPlayAgain={() => startSession(route.summary.grade, route.summary.mode, route.summary.results.length, profile)}
          onHome={() => setRoute({ name: 'grade' })}
          onProgress={() => setRoute({ name: 'progress', from: 'results' })}
        />
      )}

      {route.name === 'progress' && profile && (
        <ProgressScreen
          profile={profile}
          onBack={() =>
            route.from === 'results' && lastSummary
              ? setRoute({ name: 'results', summary: lastSummary })
              : setRoute({ name: 'grade' })
          }
        />
      )}
    </div>
  )
}
