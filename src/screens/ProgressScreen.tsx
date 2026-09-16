import { GRADES, GRADE_LABELS, wordsForGrade } from '../data/words'
import { Hex, Honeycomb, IconButton, PointsPill, Stars } from '../components/ui'
import { FlameIcon } from '../components/icons'
import { dayStreak, todayKey, type Profile } from '../lib/storage'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function ProgressScreen({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const streak = dayStreak(profile)
  const days = new Set(profile.days)

  const lastSeven = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { key: todayKey(d), letter: DAY_LETTERS[d.getDay()] }
  })

  const level = Math.floor(profile.totalPoints / 250) + 1
  const intoLevel = profile.totalPoints % 250

  return (
    <div className="screen">
      <div className="row between">
        <IconButton onClick={onBack} label="Back" />
        <PointsPill points={profile.totalPoints} />
      </div>

      <div className="row" style={{ gap: 14 }}>
        <Hex size={58} fill="var(--honey)">
          <span style={{ fontSize: 26 }}>{profile.name.charAt(0).toUpperCase()}</span>
        </Hex>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="d" style={{ fontSize: 30 }}>
            {profile.name}&rsquo;s hive
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            Level {level} &middot; best streak {profile.bestStreak}
          </div>
        </div>
      </div>

      <div className="sticker" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="row between">
          <span className="d" style={{ fontSize: 18 }}>
            Level {level}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>{250 - intoLevel} points to level {level + 1}</span>
        </div>
        <div className="bar">
          <i style={{ width: `${(intoLevel / 250) * 100}%` }} />
        </div>
      </div>

      <div className="sticker" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <FlameIcon size={20} color="var(--coral)" />
          <span className="d" style={{ fontSize: 18 }}>
            {streak === 0 ? 'Practice today to start a streak' : `${streak} day streak`}
          </span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {lastSeven.map((d, i) => (
            <span key={i} className="day" data-on={days.has(d.key)}>
              {d.letter}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GRADES.map((grade) => {
          const total = wordsForGrade(grade).length
          const progress = profile.grades[grade]
          const mastered = progress.mastered.length
          return (
            <div key={grade} className="sticker" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="row between">
                <span className="d" style={{ fontSize: 19 }}>
                  {GRADE_LABELS[grade]}
                </span>
                <Stars count={progress.bestStars} size={20} />
              </div>
              <Honeycomb total={total} filled={mastered} />
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>
                {mastered} of {total} words mastered &middot; {progress.sessions} {progress.sessions === 1 ? 'round' : 'rounds'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
