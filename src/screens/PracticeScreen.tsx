import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GRADE_LABELS, matchesWord, normalizeWord, type Grade, type WordEntry } from '../data/words'
import { Hex, IconButton, Pips, PointsPill, StreakPill, type PipState } from '../components/ui'
import {
  ArrowRightIcon,
  BulbIcon,
  ChatIcon,
  CheckIcon,
  FlameIcon,
  MicIcon,
  RetryIcon,
  SlowIcon,
  SpeakerIcon,
  UndoIcon,
} from '../components/icons'
import { POINTS_AFTER_RETRY, POINTS_FIRST_TRY, nextStreakTier, starsFor, streakBonus } from '../lib/scoring'
import { createRecognizer, setSpeechStatusListener, voiceSupported, type Recognizer } from '../lib/speech'
import { playSentence, playWord, preloadWords, spellOutWord, stopAudio } from '../lib/audio'
import type { WordResult } from '../lib/storage'
import type { Mode, SessionSummary } from '../lib/types'

type Phase = 'prompt' | 'correct' | 'wrong'
type Tone = 'none' | 'correct' | 'wrong'

type Award = { base: number; bonus: number; streak: number }

export function PracticeScreen({
  grade,
  mode: startMode,
  words,
  onFinish,
  onQuit,
  onTone,
}: {
  grade: Grade
  mode: Mode
  words: WordEntry[]
  onFinish: (summary: SessionSummary) => void
  onQuit: () => void
  onTone: (tone: Tone) => void
}) {
  const [mode, setMode] = useState<Mode>(startMode)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [typed, setTyped] = useState('')
  const [letters, setLetters] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [lastAttempt, setLastAttempt] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [award, setAward] = useState<Award>({ base: 0, bonus: 0, streak: 0 })
  const [results, setResults] = useState<WordResult[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceHint, setVoiceHint] = useState('')
  const [voiceError, setVoiceError] = useState('')
  const [micSlow, setMicSlow] = useState(false)
  const [soundFailed, setSoundFailed] = useState(false)

  const entry = words[index]
  const target = entry?.word ?? ''

  const inputRef = useRef<HTMLInputElement>(null)
  const lettersRef = useRef<string[]>([])
  const phaseRef = useRef<Phase>('prompt')
  const targetRef = useRef('')
  const recognizerRef = useRef<Recognizer | null>(null)
  const autoCheckRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)

  phaseRef.current = phase
  targetRef.current = target

  const voiceActive = mode === 'voice' && voiceSupported && !voiceError
  const soundHint = soundFailed ? 'No sound came out. Check the volume, then tap again.' : ''

  /* ----------------------------------------------------------- speaking */

  const play = useCallback((start: () => Promise<void>) => {
    setSpeaking(true)
    void start().finally(() => setSpeaking(false))
  }, [])

  const hearWord = useCallback((rate = 1) => play(() => playWord(grade, entry, rate)), [play, grade, entry])

  // Warm the next couple of clips so each word starts the moment it is asked for.
  useEffect(() => {
    preloadWords(grade, words.slice(index, index + 3))
  }, [grade, words, index])

  // Read each new word aloud as it comes up.
  useEffect(() => {
    if (!target || phase !== 'prompt' || attempts > 0) return
    const t = window.setTimeout(() => play(() => playWord(grade, entry)), 320)
    return () => window.clearTimeout(t)
    // Intentionally keyed on the word only: re-reading on every re-render would stutter.
  }, [index, target])

  useEffect(
    () => () => {
      stopAudio()
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    onTone(phase === 'correct' ? 'correct' : phase === 'wrong' ? 'wrong' : 'none')
  }, [phase, onTone])

  useEffect(() => {
    setSpeechStatusListener((ok) => setSoundFailed(!ok))
    return () => setSpeechStatusListener(null)
  }, [])

  useEffect(() => {
    if (mode === 'type' && phase === 'prompt') inputRef.current?.focus()
  }, [mode, phase, index])

  // If the mic never starts — usually an unanswered permission prompt — say so
  // instead of sitting on "Starting the mic..." forever.
  useEffect(() => {
    if (!voiceActive || phase !== 'prompt') return
    if (listening) {
      setMicSlow(false)
      return
    }
    const t = window.setTimeout(() => setMicSlow(true), 4000)
    return () => window.clearTimeout(t)
  }, [voiceActive, listening, phase])

  /* ------------------------------------------------------------ scoring */

  const finish = useCallback(
    (allResults: WordResult[], totalPoints: number, best: number) => {
      const firstTryCount = allResults.filter((r) => r.firstTry).length
      onFinish({
        grade,
        mode,
        results: allResults,
        points: totalPoints,
        bestStreak: best,
        stars: starsFor(firstTryCount, allResults.length),
      })
    },
    [grade, mode, onFinish],
  )

  const markCorrect = useCallback(
    (firstTry: boolean, attemptCount: number) => {
      const base = firstTry ? POINTS_FIRST_TRY : POINTS_AFTER_RETRY
      const nextStreak = firstTry ? streak + 1 : 0
      const bonus = firstTry ? streakBonus(nextStreak) : 0
      setPoints((p) => p + base + bonus)
      setStreak(nextStreak)
      setBestStreak((b) => Math.max(b, nextStreak))
      setAward({ base, bonus, streak: nextStreak })
      setResults((r) => [...r, { word: target, firstTry, correct: true, attempts: attemptCount }])
      setPhase('correct')
      stopAudio()
    },
    [streak, target],
  )

  const check = useCallback(
    (value: string) => {
      const attempt = value.trim().toLowerCase()
      if (!attempt) return
      const attemptCount = attempts + 1
      setAttempts(attemptCount)
      setLastAttempt(attempt)
      if (matchesWord(entry, attempt)) {
        markCorrect(attempts === 0, attemptCount)
      } else {
        setStreak(0)
        setPhase('wrong')
        stopAudio()
      }
    },
    [attempts, entry, markCorrect],
  )

  const checkRef = useRef(check)
  checkRef.current = check

  /* ------------------------------------------------------- voice input */

  const applyLetters = useCallback((next: string[]) => {
    lettersRef.current = next
    setLetters(next)
  }, [])

  useEffect(() => {
    if (mode !== 'voice' || !voiceSupported) return

    const recognizer = createRecognizer(
      () => targetRef.current,
      {
        onTokens: (tokens) => {
          if (phaseRef.current !== 'prompt') return
          let next = [...lettersRef.current]
          let submit = false
          let unknown = false
          for (const token of tokens) {
            if (token.type === 'letter') {
              if (next.length < targetRef.current.length) next.push(token.letter)
            } else if (token.type === 'undo') {
              next.pop()
            } else if (token.type === 'clear') {
              next = []
            } else if (token.type === 'submit') {
              submit = true
            } else {
              unknown = true
            }
          }
          setVoiceHint(unknown && next.length === lettersRef.current.length ? 'I did not catch that — say the letter name.' : '')
          lettersRef.current = next
          setLetters(next)

          if (autoCheckRef.current) window.clearTimeout(autoCheckRef.current)
          if (submit || next.length === targetRef.current.length) {
            autoCheckRef.current = window.setTimeout(() => {
              if (phaseRef.current === 'prompt') checkRef.current(lettersRef.current.join(''))
            }, submit ? 150 : 700)
          }
        },
        onStateChange: (state) => setListening(state === 'listening'),
        onError: (error) => {
          setVoiceError(
            error === 'not-allowed' || error === 'service-not-allowed'
              ? 'The microphone is blocked. Allow it in your browser, or switch to typing.'
              : 'The microphone had a problem. You can switch to typing.',
          )
        },
      },
    )

    recognizerRef.current = recognizer
    return () => {
      recognizer?.destroy()
      recognizerRef.current = null
      if (autoCheckRef.current) window.clearTimeout(autoCheckRef.current)
    }
  }, [mode])

  useEffect(() => {
    const recognizer = recognizerRef.current
    if (!recognizer) return
    if (mode === 'voice' && phase === 'prompt' && !voiceError) recognizer.start()
    else recognizer.stop()
  }, [mode, phase, index, voiceError])

  /* ------------------------------------------------------------ actions */

  function resetWordInput() {
    setTyped('')
    applyLetters([])
    setVoiceHint('')
  }

  function nextWord(updatedResults: WordResult[], updatedPoints: number) {
    if (index + 1 >= words.length) {
      finish(updatedResults, updatedPoints, bestStreak)
      return
    }
    setIndex(index + 1)
    setPhase('prompt')
    setAttempts(0)
    setRevealed(false)
    setLastAttempt('')
    resetWordInput()
  }

  function handleNextAfterCorrect() {
    nextWord(results, points)
  }

  function handleTryAgain() {
    setPhase('prompt')
    resetWordInput()
    hearWord()
  }

  function handleReveal() {
    const updated: WordResult[] = [...results, { word: target, firstTry: false, correct: false, attempts }]
    setResults(updated)
    setRevealed(true)
    play(() => spellOutWord(target))
    // Give the spelling time to finish before moving on; the button skips ahead.
    const wait = Math.min(7000, 1800 + target.length * 420)
    revealTimerRef.current = window.setTimeout(() => nextWord(updated, points), wait)
  }

  function skipReveal() {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
    stopAudio()
    nextWord(results, points)
  }

  /* -------------------------------------------------------------- views */

  const pipStates: PipState[] = useMemo(
    () =>
      words.map((_, i) => {
        if (i < results.length) return results[i].firstTry ? 'done' : 'missed'
        if (i === index) return 'current'
        return 'todo'
      }),
    [words, results, index],
  )

  if (!entry) return null

  const header = (
    <>
      <div className="row between">
        <IconButton onClick={onQuit} label="End practice" variant="close" />
        <div className="row" style={{ gap: 10 }}>
          <PointsPill points={points} />
          <StreakPill streak={streak} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <span className="d" style={{ fontSize: 17 }}>
            Word {index + 1} of {words.length}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)' }}>
            {GRADE_LABELS[grade]} &middot; {mode === 'type' ? 'Type it' : 'Say the letters'}
          </span>
        </div>
        <Pips states={pipStates} />
      </div>
    </>
  )

  if (phase === 'correct') {
    const tier = nextStreakTier(award.streak)
    return (
      <div className="screen" style={{ alignItems: 'center' }}>
        <div className="row between" style={{ alignSelf: 'stretch' }}>
          <span className="d" style={{ fontSize: 17, color: 'var(--leaf-ink)' }}>
            Word {index + 1} of {words.length}
          </span>
          <PointsPill points={points} />
        </div>

        <div className="grow" />

        <div className="pop-in">
          <Hex size={130} fill="var(--leaf)">
            <CheckIcon size={62} color="#fff" />
          </Hex>
        </div>

        <div className="d pop-in" style={{ fontSize: 56 }}>
          {award.streak >= 5 ? 'Amazing!' : 'Yes!'}
        </div>

        <div className="sticker" style={{ alignSelf: 'stretch', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="tiny">You spelled it</div>
          <div className="d" style={{ fontSize: target.length > 11 ? 28 : 36, letterSpacing: 1 }}>
            {target}
          </div>
          <button className="linkish row" style={{ gap: 7, marginTop: 2 }} type="button" onClick={() => hearWord()}>
            <SpeakerIcon size={17} color="#8A7550" />
            Hear it one more time
          </button>
        </div>

        <div className="row" style={{ alignSelf: 'stretch', gap: 12 }}>
          <div className="sticker rise" style={{ flex: 1, padding: '14px 10px', textAlign: 'center', background: 'var(--honey)' }}>
            <div className="d" style={{ fontSize: 30 }}>
              +{award.base}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#4A3A18' }}>{award.base === POINTS_FIRST_TRY ? 'first try' : 'got there'}</div>
          </div>
          {award.bonus > 0 && (
            <div className="sticker rise" style={{ flex: 1, padding: '14px 10px', textAlign: 'center', background: 'var(--ink)' }}>
              <div className="d" style={{ fontSize: 30, color: 'var(--honey)' }}>
                +{award.bonus}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--honey-pale)' }}>{award.streak} in a row</div>
            </div>
          )}
        </div>

        {tier && award.streak > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <FlameIcon size={19} color="var(--coral)" />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--leaf-ink)' }}>
              {tier - award.streak} more in a row for a bigger bonus
            </span>
          </div>
        )}

        <div className="grow" />

        <button className="btn primary" type="button" onClick={handleNextAfterCorrect}>
          {index + 1 >= words.length ? 'See my score' : 'Next word'}
          <ArrowRightIcon />
        </button>
      </div>
    )
  }

  if (phase === 'wrong') {
    return (
      <div className="screen" style={{ alignItems: 'center' }}>
        <div className="row between" style={{ alignSelf: 'stretch' }}>
          <span className="d" style={{ fontSize: 17, color: 'var(--coral-ink)' }}>
            Word {index + 1} of {words.length}
          </span>
          <PointsPill points={points} />
        </div>

        <div className="grow" />

        <div className="pop-in">
          <Hex size={112} fill="var(--coral)">
            <RetryIcon size={52} color="#fff" />
          </Hex>
        </div>

        <div className="d" style={{ fontSize: 46 }}>
          {revealed ? 'Here it is' : 'So close!'}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--coral-ink)', textAlign: 'center' }}>
          {revealed ? 'Listen and remember it for next time.' : 'Have another go — you keep half the points.'}
        </div>

        <div className="sticker shake" style={{ alignSelf: 'stretch', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="tiny">You wrote</div>
          <div className="d" style={{ fontSize: lastAttempt.length > 11 ? 26 : 32, letterSpacing: 1, color: '#B23A18' }}>
            {lastAttempt}
          </div>
        </div>

        {revealed && (
          <div className="sticker" style={{ alignSelf: 'stretch', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--cream)' }}>
            <div className="tiny">The word is</div>
            <div className="d" style={{ fontSize: target.length > 11 ? 26 : 32, letterSpacing: 1 }}>
              {markDiff(target, lastAttempt)}
            </div>
            {entry.sentence && (
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <BulbIcon size={17} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{entry.sentence}</span>
              </div>
            )}
          </div>
        )}

        <div className="grow" />

        {revealed && (
          <button className="btn primary" type="button" style={{ alignSelf: 'stretch' }} onClick={skipReveal}>
            {index + 1 >= words.length ? 'See my score' : 'Next word'}
            <ArrowRightIcon />
          </button>
        )}

        {!revealed && (
          <>
            <div className="row" style={{ alignSelf: 'stretch', gap: 12 }}>
              <button className="btn" type="button" style={{ width: 140, fontSize: 17, fontWeight: 700 }} onClick={() => hearWord(0.75)}>
                <SpeakerIcon size={21} />
                Hear it
              </button>
              <button className="btn primary" type="button" onClick={handleTryAgain}>
                Try again
              </button>
            </div>
            <button className="linkish" type="button" onClick={handleReveal}>
              Show me and move on
            </button>
          </>
        )}
      </div>
    )
  }

  /* -------------------------------------------------------- prompt phase */

  return (
    <div className="screen">
      {header}

      {voiceActive ? (
        <>
          <button className="btn" type="button" onClick={() => hearWord()} style={{ fontSize: 20, minHeight: 60 }}>
            <SpeakerIcon size={25} />
            Hear the word
          </button>

          {soundHint && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--coral-ink)' }}>
              {soundHint}
            </div>
          )}

          <div
            className="tiles"
            style={{ marginTop: 6, ['--tile-w' as string]: `${tileWidth(target.length)}px` }}
          >
            {Array.from({ length: target.length }).map((_, i) => (
              <span key={i} className="tile" data-state={i < letters.length ? 'filled' : i === letters.length ? 'next' : undefined}>
                {letters[i] ?? ''}
              </span>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 800, color: 'var(--muted)' }}>
            {voiceHint || `${letters.length} of ${target.length} letters — say the next one`}
          </div>

          <div className="grow" />

          <div className="row" style={{ flexDirection: 'column', gap: 12 }}>
            <div className="mic-wrap" data-listening={listening}>
              <span className="mic-ring r1" />
              <span className="mic-ring r2" />
              <button
                className="mic"
                type="button"
                data-listening={listening}
                onClick={() => recognizerRef.current?.start()}
                aria-label={listening ? 'Listening' : 'Start listening'}
              >
                <MicIcon size={54} color={listening ? '#FFC42E' : '#1C1508'} />
              </button>
            </div>
            <div className="d" style={{ fontSize: 23 }}>
              {listening ? 'Listening…' : micSlow ? 'Tap the mic to start' : 'Starting the mic…'}
            </div>
            {!listening && micSlow && (
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', textAlign: 'center' }}>
                If your browser asked to use the microphone, choose Allow.
              </div>
            )}
          </div>

          <div className="grow" />

          <div className="row" style={{ gap: 12 }}>
            <button
              className="btn"
              type="button"
              style={{ width: 130, fontSize: 17, fontWeight: 700 }}
              onClick={() => applyLetters(lettersRef.current.slice(0, -1))}
              disabled={letters.length === 0}
            >
              <UndoIcon size={20} />
              Undo
            </button>
            <button className="btn primary" type="button" onClick={() => check(letters.join(''))} disabled={letters.length === 0}>
              Check it
              <CheckIcon />
            </button>
          </div>

          <button className="linkish" type="button" onClick={() => setMode('type')}>
            Type it instead
          </button>
        </>
      ) : (
        <>
          {voiceError && (
            <div className="sticker" style={{ padding: '14px 16px', background: 'var(--coral-pale)', fontSize: 14 }}>
              {voiceError}
            </div>
          )}

          <div className="grow" />

          <div className="row" style={{ flexDirection: 'column', gap: 14 }}>
            <button className="hear" type="button" data-speaking={speaking} onClick={() => hearWord()} aria-label="Hear the word">
              <SpeakerIcon size={74} />
            </button>
            <div className="d" style={{ fontSize: 26 }}>
              Tap to hear the word
            </div>
            {soundHint && (
              <div
                style={{
                  maxWidth: 300,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--coral-ink)',
                }}
              >
                {soundHint}
              </div>
            )}
          </div>

          <div className="grid2" style={{ marginTop: 4 }}>
            <button className="btn small" type="button" onClick={() => hearWord(0.6)}>
              <SlowIcon size={18} />
              Say it slower
            </button>
            <button
              className="btn small"
              type="button"
              onClick={() => play(() => playSentence(grade, entry))}
              disabled={!entry.sentence}
            >
              <ChatIcon size={18} />
              In a sentence
            </button>
          </div>

          <div className="grow" />

          <form
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            onSubmit={(e) => {
              e.preventDefault()
              check(typed)
            }}
          >
            <label style={{ fontSize: 14, fontWeight: 800, color: 'var(--muted)' }} htmlFor="answer">
              Type the word you heard
            </label>
            <input
              id="answer"
              ref={inputRef}
              className="answer-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="your answer"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              inputMode="text"
            />
            <button className="btn primary" type="submit" disabled={!typed.trim()} style={{ marginTop: 10 }}>
              Check it
              <CheckIcon />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

/**
 * Tile size that keeps a word on one row at a phone's ~350px of usable width
 * (6px gaps). Past ten letters a single row gets too cramped, so we fix the
 * size and let the row wrap into two.
 */
function tileWidth(length: number): number {
  if (length >= 11) return 36
  return Math.max(28, Math.min(46, Math.floor(356 / length) - 6))
}

/**
 * Underlines the letters the attempt got wrong — but only when the attempt was
 * close. A position-by-position diff of two very different words marks almost
 * every letter, which teaches nothing.
 */
function markDiff(correct: string, attempt: string) {
  const plain = normalizeWord(correct)
  const given = normalizeWord(attempt)
  const wrongAt = plain.split('').map((ch, i) => given[i] !== ch)
  const wrongCount = wrongAt.filter(Boolean).length
  if (given.length !== plain.length || wrongCount > 3) return correct

  return correct.split('').map((ch, i) => (
    <span key={i} style={wrongAt[i] ? { borderBottom: '5px solid var(--honey-deep)' } : undefined}>
      {ch}
    </span>
  ))
}
