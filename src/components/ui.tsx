import type { CSSProperties, ReactNode } from 'react'
import { BackIcon, CloseIcon, FlameIcon, HexIcon } from './icons'

export function Hex({
  size = 56,
  fill = '#FFF6E3',
  children,
  className,
}: {
  size?: number
  fill?: string
  children?: ReactNode
  className?: string
}) {
  const style: CSSProperties = { width: size, height: Math.round((size * 62) / 56) }
  return (
    <div className={`hex${className ? ` ${className}` : ''}`} style={style}>
      <span className="hex-fill" style={{ background: fill }} />
      <span className="hex-content">{children}</span>
    </div>
  )
}

export function PointsPill({ points }: { points: number }) {
  return (
    <div className="pill" aria-label={`${points} points`}>
      <HexIcon size={19} />
      <span>{points}</span>
    </div>
  )
}

export function StreakPill({ streak }: { streak: number }) {
  return (
    <div className="pill" style={{ background: 'var(--honey)' }} aria-label={`${streak} in a row`}>
      <FlameIcon size={17} />
      <span>{streak}</span>
    </div>
  )
}

export type PipState = 'todo' | 'done' | 'missed' | 'current'

export function Pips({ states }: { states: PipState[] }) {
  return (
    <div className="pips" aria-hidden>
      {states.map((state, i) => (
        <span className="pip" data-state={state} key={i}>
          <i />
        </span>
      ))}
    </div>
  )
}

export function IconButton({
  onClick,
  label,
  variant = 'back',
}: {
  onClick: () => void
  label: string
  variant?: 'back' | 'close'
}) {
  return (
    <button className="btn round" onClick={onClick} aria-label={label} type="button">
      {variant === 'back' ? <BackIcon size={22} /> : <CloseIcon size={22} />}
    </button>
  )
}

export function Stars({ count, size = 44 }: { count: number; size?: number }) {
  return (
    <div className="row" style={{ gap: 10 }} aria-label={`${count} out of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? 'pop-in' : undefined} style={{ animationDelay: `${i * 0.12 + 0.1}s` }}>
          <StarSvg size={size} filled={i < count} />
        </span>
      ))}
    </div>
  )
}

function StarSvg({ size, filled }: { size: number; filled: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95L12 2.6Z"
        fill={filled ? '#FFC42E' : '#FFFFFF'}
        stroke="#1C1508"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const HEX_R = 14
const HEX_W = HEX_R * Math.sqrt(3)
const HEX_ROW = HEX_R * 1.5

/** One SVG of staggered hexagons — `filled` of `total` cells are honey. */
export function Honeycomb({ total, filled, perRow = 10 }: { total: number; filled: number; perRow?: number }) {
  const rows = Math.ceil(total / perRow)
  const width = perRow * HEX_W + HEX_W / 2
  const height = (rows - 1) * HEX_ROW + HEX_R * 2

  const cells = Array.from({ length: total }).map((_, i) => {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const cx = HEX_W / 2 + col * HEX_W + (row % 2) * (HEX_W / 2)
    const cy = HEX_R + row * HEX_ROW
    const points = [
      [cx, cy - HEX_R],
      [cx + HEX_W / 2, cy - HEX_R / 2],
      [cx + HEX_W / 2, cy + HEX_R / 2],
      [cx, cy + HEX_R],
      [cx - HEX_W / 2, cy + HEX_R / 2],
      [cx - HEX_W / 2, cy - HEX_R / 2],
    ]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')
    return <polygon key={i} points={points} fill={i < filled ? '#FFC42E' : '#EADCBE'} />
  })

  return (
    <svg
      viewBox={`0 0 ${width.toFixed(1)} ${height.toFixed(1)}`}
      width="100%"
      style={{ display: 'block' }}
      role="img"
      aria-label={`${filled} of ${total} words mastered`}
    >
      <g stroke="#1C1508" strokeWidth="1.2" strokeLinejoin="round">
        {cells}
      </g>
    </svg>
  )
}
