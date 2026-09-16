import { useState } from 'react'
import { ArrowRightIcon, BeeLogo, LockIcon } from '../components/icons'
import { listProfiles } from '../lib/storage'

export function NameScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('')
  const recent = listProfiles().slice(0, 3)
  const trimmed = name.trim()

  function submit(value: string) {
    const clean = value.trim()
    if (clean) onStart(clean)
  }

  return (
    <form
      className="screen"
      onSubmit={(e) => {
        e.preventDefault()
        submit(name)
      }}
    >
      <div style={{ height: 24 }} />
      <div className="row" style={{ flexDirection: 'column', gap: 16 }}>
        <BeeLogo size={116} />
        <div className="d" style={{ fontSize: 46, letterSpacing: -0.5 }}>
          BeePractice
        </div>
        <div className="muted" style={{ fontSize: 17 }}>
          Hear it. Spell it. Nail it.
        </div>
      </div>

      <div className="grow" />

      <div className="sticker" style={{ padding: '22px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label className="d" style={{ fontSize: 26 }} htmlFor="student-name">
          What&rsquo;s your name?
        </label>
        <div className="muted">So we can keep track of your points.</div>
        <input
          id="student-name"
          className="name-input"
          style={{ marginTop: 6 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          maxLength={20}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
      </div>

      {recent.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="tiny">Practiced here before</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
            {recent.map((p) => (
              <button
                key={p.name}
                type="button"
                className="btn small"
                style={{ width: 'auto', background: 'var(--honey-pale)' }}
                onClick={() => submit(p.name)}
              >
                {p.name}
                <span style={{ fontFamily: 'var(--body)', fontSize: 13, color: 'var(--muted)' }}>{p.totalPoints} pts</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grow" />

      <button className="btn primary" type="submit" disabled={!trimmed}>
        Let&rsquo;s go
        <ArrowRightIcon />
      </button>

      <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
        <LockIcon />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-soft)' }}>Everything stays on this device.</span>
      </div>
    </form>
  )
}
