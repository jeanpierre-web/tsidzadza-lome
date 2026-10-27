import { useId } from 'react'
import type { Level } from '../types'
import { LEVELS } from '../levels'

const WATER_Y: Record<Level, number> = { cheville: 39.5, genou: 33, taille: 26 }

function Figure({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <circle cx="24" cy="7.5" r="4.6" />
      <rect x="17.5" y="13.5" width="13" height="15.5" rx="4.5" />
      <rect x="12.6" y="14.6" width="4.2" height="13.5" rx="2.1" />
      <rect x="31.2" y="14.6" width="4.2" height="13.5" rx="2.1" />
      <rect x="18.2" y="26" width="5.4" height="18.5" rx="2.5" />
      <rect x="24.4" y="26" width="5.4" height="18.5" rx="2.5" />
    </g>
  )
}

/** Pictogramme de niveau d'eau : silhouette + eau jusqu'à cheville / genou / taille. */
export function LevelIcon({ level, size = 48, title }: { level: Level; size?: number; title?: string }) {
  const id = useId()
  const y = WATER_Y[level]
  const meta = LEVELS[level]
  const wave = `M0 ${y} q4 -2.2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V48 H0z`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={title ?? meta.ariaLabel}>
      <title>{title ?? meta.ariaLabel}</title>
      <defs>
        <clipPath id={`w${id}`}>
          <path d={wave} />
        </clipPath>
      </defs>
      <Figure fill="#0B2E36" />
      <path d={wave} fill={meta.color} />
      <g clipPath={`url(#w${id})`} opacity=".55">
        <Figure fill="#0B2E36" />
      </g>
      <path d={`M0 ${y} q4 -2.2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0`} fill="none" stroke="#0B2E36" strokeWidth="1.6" />
    </svg>
  )
}

type P = { className?: string; size?: number }
const base = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export const DropLogo = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <rect width="64" height="64" rx="18" fill="#0B2E36" />
    <path d="M32 11c8.5 11.5 14.5 18.5 14.5 27a14.5 14.5 0 0 1-29 0c0-8.5 6-15.5 14.5-27z" fill="#7FD3D0" />
    <path d="M17.6 40.5c5 3 9.5 3 14.4 0s9.4-3 14.4 0a14.5 14.5 0 0 1-28.8 0z" fill="#F2B43A" />
  </svg>
)
export const CameraIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>)
export const PinIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>)
export const TargetIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>)
export const CheckIcon = ({ className, size }: P) => (<svg {...base(size)} className={className} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>)
export const XIcon = ({ className, size }: P) => (<svg {...base(size)} className={className} strokeWidth={2.4}><path d="M6 6l12 12M18 6L6 18" /></svg>)
export const PhoneIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></svg>)
export const ListIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>)
export const ArrowLeft = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M15 5l-7 7 7 7" /></svg>)
export const PlayIcon = ({ className, size }: P) => (<svg width={size ?? 22} height={size ?? 22} viewBox="0 0 24 24" className={className} aria-hidden><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>)
export const ShieldIcon = ({ className, size }: P) => (<svg {...base(size)} className={className}><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>)
