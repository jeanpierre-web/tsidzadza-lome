import { useEffect, useState } from 'react'
import { PlayIcon } from './Icons'

/**
 * Emplacement réservé à l'alerte animée (motion design sans texte, 10–15 s).
 * Pour le remplir : déposer `src/assets/alerte.mp4` (ou `.webm`), ou définir
 * `VITE_ALERT_VIDEO_URL`. Tant que les deux manquent, le cadre reste visible.
 */
const bundledAlert = import.meta.glob('../assets/alerte.{mp4,webm}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

function alertVideoSrc(): string | undefined {
  const fromEnv = import.meta.env.VITE_ALERT_VIDEO_URL?.trim()
  if (fromEnv) return fromEnv
  return Object.values(bundledAlert).find((url) => typeof url === 'string' && url.length > 0)
}

function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

export function AlertSlot({ compact = false }: { compact?: boolean }) {
  const src = alertVideoSrc()
  const reduce = useReducedMotion()
  const [broken, setBroken] = useState(false)
  const show = Boolean(src) && !broken

  return (
    <section aria-label="Alerte animée" className="overflow-hidden rounded-2xl bg-ink text-white">
      {show ? (
        <video
          src={src}
          className="aspect-video w-full"
          autoPlay={!reduce}
          muted
          loop={!reduce}
          playsInline
          controls
          preload={reduce ? 'none' : 'metadata'}
          onError={() => setBroken(true)}
        />
      ) : (
        <div className={`relative flex items-center gap-3 ${compact ? 'p-3' : 'aspect-video flex-col justify-center p-4'}`}>
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #7FD3D0 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, #7FD3D0 0 2px, transparent 3px)', backgroundSize: '26px 34px' }} />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aqua text-ink"><PlayIcon size={24} /></span>
          <div className={`relative ${compact ? '' : 'text-center'}`}>
            <div className="font-display text-[15px] font-bold">Alerte animée</div>
            <div className="text-[12px] text-white/65">Emplacement réservé — vidéo à venir</div>
          </div>
        </div>
      )}
    </section>
  )
}
