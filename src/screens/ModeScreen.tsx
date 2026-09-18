import { useState } from 'react'
import { GRADE_LABELS, type Grade } from '../data/words'
import { Hex, IconButton } from '../components/ui'
import { ArrowRightIcon, KeyboardIcon, MicIcon } from '../components/icons'
import { defaultSessionLength, sessionLengths } from '../lib/session'
import { voiceSupported } from '../lib/speech'
import type { Mode } from '../lib/types'

export function ModeScreen({
  grade,
  onBack,
  onStart,
}: {
  grade: Grade
  onBack: () => void
  onStart: (mode: Mode, length: number) => void
}) {
  const lengths = sessionLengths(grade)
  const [mode, setMode] = useState<Mode>('type')
  const [length, setLength] = useState(defaultSessionLength(grade))

  return (
    <div className="screen">
      <div className="row between">
        <IconButton onClick={onBack} label="Back to grades" />
        <div className="pill" style={{ background: 'var(--honey)', fontSize: 19 }}>
          {GRADE_LABELS[grade]}
        </div>
      </div>

      <div className="d" style={{ fontSize: 34 }}>
        How do you want
        <br />
        to practice?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          type="button"
          className="card-button"
          style={{ background: mode === 'type' ? 'var(--honey)' : '#fff' }}
          onClick={() => setMode('type')}
          aria-pressed={mode === 'type'}
        >
          <Hex size={60} fill="var(--cream)">
            <KeyboardIcon size={29} />
          </Hex>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="d" style={{ fontSize: 25 }}>
              Type it
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: mode === 'type' ? '#4A3A18' : 'var(--muted)', lineHeight: 1.35 }}>
              Hear the word, then type it on the keyboard.
            </div>
          </div>
        </button>

        <button
          type="button"
          className="card-button"
          style={{ background: mode === 'voice' ? 'var(--honey)' : '#fff' }}
          onClick={() => setMode('voice')}
          aria-pressed={mode === 'voice'}
          disabled={!voiceSupported}
        >
          <Hex size={60} fill="var(--honey-pale)">
            <MicIcon size={29} />
          </Hex>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="d" style={{ fontSize: 25 }}>
              Say the letters
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: mode === 'voice' ? '#4A3A18' : 'var(--muted)', lineHeight: 1.35 }}>
              Hear the word, then spell it out loud, one letter at a time.
            </div>
            <span className="note">
              {voiceSupported ? 'Needs the microphone' : 'Not available in this browser'}
            </span>
          </div>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="d" style={{ fontSize: 20 }}>
          How many words?
        </div>
        <div className="grid4">
          {lengths.map((n) => (
            <button key={n} type="button" className="chip" data-selected={length === n} onClick={() => setLength(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grow" />

      <button className="btn primary" type="button" onClick={() => onStart(mode, length)}>
        Start practice
        <ArrowRightIcon />
      </button>
    </div>
  )
}
