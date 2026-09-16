import { GRADE_LABELS } from '../data/words'
import { PointsPill, Stars } from '../components/ui'
import { ArrowRightIcon, HexIcon, SpeakerIcon, TrophyIcon } from '../components/icons'
import { STAR_MESSAGES } from '../lib/scoring'
import { playWord } from '../lib/audio'
import type { Profile } from '../lib/storage'
import type { SessionSummary } from '../lib/types'

export function ResultsScreen({
  profile,
  summary,
  onPlayAgain,
  onHome,
  onProgress,
}: {
  profile: Profile
  summary: SessionSummary
  onPlayAgain: () => void
  onHome: () => void
  onProgress: () => void
}) {
  const firstTry = summary.results.filter((r) => r.firstTry).length
  const toRedo = summary.results.filter((r) => !r.firstTry)

  return (
    <div className="screen" style={{ alignItems: 'center' }}>
      <div className="row between" style={{ alignSelf: 'stretch' }}>
        <span className="d" style={{ fontSize: 18 }}>
          {GRADE_LABELS[summary.grade]}
        </span>
        <PointsPill points={profile.totalPoints} />
      </div>

      <div className="d" style={{ fontSize: 38, textAlign: 'center' }}>
        Nice work, {profile.name}!
      </div>

      <Stars count={summary.stars} size={52} />

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>
        {STAR_MESSAGES[summary.stars]}
      </div>

      <div className="sticker" style={{ alignSelf: 'stretch', padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--honey)' }}>
        <div className="row" style={{ gap: 10 }}>
          <HexIcon size={28} color="#1C1508" stroke="#1C1508" />
          <span className="d" style={{ fontSize: 52 }}>
            {summary.points}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#4A3A18' }}>points this round</div>
      </div>

      <div className="row" style={{ alignSelf: 'stretch', gap: 10 }}>
        <Stat value={`${firstTry}/${summary.results.length}`} label="first try" />
        <Stat value={String(summary.bestStreak)} label="best streak" />
        <Stat value={summary.mode === 'type' ? 'Typed' : 'Spoken'} label="this round" />
      </div>

      {toRedo.length > 0 && (
        <div className="sticker" style={{ alignSelf: 'stretch', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="d" style={{ fontSize: 19 }}>
            Practice these again
          </div>
          {toRedo.map((r) => (
            <button
              key={r.word}
              type="button"
              className="row between"
              style={{
                border: '3px solid var(--ink)',
                borderRadius: 14,
                background: 'var(--cream)',
                padding: '10px 14px',
                minHeight: 52,
              }}
              onClick={() => void playWord(summary.grade, { word: r.word })}
            >
              <span className="d" style={{ fontSize: 20 }}>
                {r.word}
              </span>
              <SpeakerIcon size={20} />
            </button>
          ))}
        </div>
      )}

      <div className="grow" />

      <button className="btn primary" type="button" onClick={onPlayAgain} style={{ alignSelf: 'stretch' }}>
        Play again
        <ArrowRightIcon />
      </button>

      <div className="row" style={{ alignSelf: 'stretch', gap: 12 }}>
        <button className="btn small" type="button" onClick={onProgress}>
          <TrophyIcon size={18} />
          My hive
        </button>
        <button className="btn small" type="button" onClick={onHome}>
          Pick a grade
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="sticker" style={{ flex: 1, padding: '12px 6px', textAlign: 'center' }}>
      <div className="d" style={{ fontSize: 24 }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
