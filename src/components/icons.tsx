type IconProps = { size?: number; color?: string }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true as const,
})

export function SpeakerIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 9.5h3.2L12.5 5v14L7.2 14.5H4z" fill={color} stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M16.4 9.2a4 4 0 0 1 0 5.6" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19.2 6.4a8 8 0 0 1 0 11.2" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function MicIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill={color} />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12 17.5v4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function KeyboardIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2" y="6" width="20" height="13" rx="3" stroke={color} strokeWidth="2.4" />
      <path
        d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M6.5 13.5h.01M10 13.5h.01M13.5 13.5h.01M17 13.5h.01"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M8 16.4h8" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4.5 12.5l5 5L19.5 7" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function BackIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M14 6l-6 6 6 6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 12h13M12 6l6 6-6 6" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UndoIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 10h11a5 5 0 0 1 0 10H9" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 5l-5 5 5 5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RetryIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 11.5A8 8 0 1 1 17.6 6" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M20.5 3v5.5H15" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChatIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M20.5 12.5a7.5 7.5 0 0 1-10.6 6.8L4 21l1.7-5.4A7.5 7.5 0 1 1 20.5 12.5Z"
        stroke={color}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SlowIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.6" />
      <path d="M12 7v5l3.2 2" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FlameIcon({ size = 24, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M13 2.5c.8 4-1.6 5.4-3.4 7.2C7.6 11.7 6 13.4 6 16a6 6 0 0 0 12 0c0-2.4-1.1-4-2.3-5.4-.5 1.3-1.3 2-2.2 2.3.9-3.3-.2-7-.5-10.4Z"
        fill={color}
      />
    </svg>
  )
}

export function HexIcon({ size = 22, color = '#F59300', stroke = '#1C1508' }: IconProps & { stroke?: string }) {
  return (
    <svg width={size} height={(size * 22) / 20} viewBox="0 0 20 22" fill="none" aria-hidden>
      <path d="M10 1.5 L18.5 6.25 V15.75 L10 20.5 L1.5 15.75 V6.25 Z" fill={color} stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

export function StarIcon({ size = 44, filled = true }: { size?: number; filled?: boolean }) {
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

export function BulbIcon({ size = 20, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 18h6M10 21h4" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7h6c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5Z"
        stroke={color}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ size = 16, color = '#8A7550' }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="10" width="16" height="10" rx="2.5" stroke={color} strokeWidth="2.4" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function BeeLogo({ size = 112 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 112 112" fill="none" aria-hidden>
      <path d="M56 4 L100 29 L100 79 L56 104 L12 79 L12 29 Z" fill="#FFC42E" stroke="#1C1508" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="42" cy="43" rx="13" ry="9" transform="rotate(-28 42 43)" fill="#FFF6E3" stroke="#1C1508" strokeWidth="4" />
      <ellipse cx="70" cy="43" rx="13" ry="9" transform="rotate(28 70 43)" fill="#FFF6E3" stroke="#1C1508" strokeWidth="4" />
      <path d="M47 51 C44 43 40 41 37 40" stroke="#1C1508" strokeWidth="4" strokeLinecap="round" />
      <path d="M65 51 C68 43 72 41 75 40" stroke="#1C1508" strokeWidth="4" strokeLinecap="round" />
      <rect x="42" y="50" width="28" height="38" rx="14" fill="#1C1508" />
      <path d="M44 63 H68" stroke="#FFC42E" strokeWidth="5" strokeLinecap="round" />
      <path d="M45 74 H67" stroke="#FFC42E" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function TrophyIcon({ size = 22, color = '#1C1508' }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 3h10v5a5 5 0 0 1-10 0V3Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 13v4M8.5 21h7M10 17h4l.8 4H9.2l.8-4Z" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  )
}
