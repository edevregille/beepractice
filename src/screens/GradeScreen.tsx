import { GRADES, GRADE_LABELS, wordsForGrade, type Grade } from '../data/words'
import { Hex, IconButton, PointsPill } from '../components/ui'
import { TrophyIcon } from '../components/icons'
import type { Profile } from '../lib/storage'

const ORDINALS: Record<Grade, string> = { 3: 'rd', 4: 'th', 5: 'th', 6: 'th' }
const TINTS: Record<Grade, string> = { 3: '#FFE9A8', 4: '#FFC42E', 5: '#FFD96B', 6: '#FFB05A' }

export function GradeScreen({
  profile,
  onPick,
  onBack,
  onProgress,
}: {
  profile: Profile
  onPick: (grade: Grade) => void
  onBack: () => void
  onProgress: () => void
}) {
  return (
    <div className="screen">
      <div className="row between">
        <IconButton onClick={onBack} label="Change student" />
        <PointsPill points={profile.totalPoints} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="d" style={{ fontSize: 38 }}>
          Hi, {profile.name}!
        </div>
        <div className="muted" style={{ fontSize: 17 }}>
          Pick your grade to start practicing.
        </div>
      </div>

      <div className="grid2">
        {GRADES.map((grade) => {
          const total = wordsForGrade(grade).length
          const mastered = profile.grades[grade].mastered.length
          const pct = total ? Math.round((mastered / total) * 100) : 0
          return (
            <button
              key={grade}
              type="button"
              className="card-button"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, background: TINTS[grade] }}
              onClick={() => onPick(grade)}
              disabled={total === 0}
            >
              <Hex size={54} fill="#FFF6E3">
                <span style={{ fontSize: 24 }}>
                  {grade}
                  <span style={{ fontSize: 13 }}>{ORDINALS[grade]}</span>
                </span>
              </Hex>
              <div className="d" style={{ fontSize: 21 }}>
                {GRADE_LABELS[grade]}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>{total} words</div>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {mastered === 0 ? 'Not started' : mastered === total ? `All ${total} mastered` : `${mastered} mastered`}
              </div>
            </button>
          )
        })}
      </div>

      <div className="grow" />

      <button type="button" className="card-button" onClick={onProgress}>
        <Hex size={44} fill="var(--honey)">
          <TrophyIcon size={20} />
        </Hex>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="d" style={{ fontSize: 19 }}>
            {profile.name}&rsquo;s hive
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
            {profile.totalPoints} points &middot; best streak {profile.bestStreak}
          </div>
        </div>
      </button>
    </div>
  )
}
