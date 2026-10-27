import { PlayIcon } from './Icons'

/**
 * Emplacement réservé à l'alerte animée (motion design sans texte, 10–15 s).
 * Mettre VITE_ALERT_VIDEO_URL (MP4/WebM) ou remplacer par un lecteur Lottie plus tard.
 */
export function AlertSlot({ compact = false }: { compact?: boolean }) {
  const src = import.meta.env.VITE_ALERT_VIDEO_URL
  return (
    <section aria-label="Alerte animée" className="overflow-hidden rounded-2xl bg-ink text-white">
      {src ? (
        <video src={src} className="aspect-video w-full" autoPlay muted loop playsInline controls />
      ) : (
        <div className={`relative flex items-center gap-3 ${compact ? 'p-3' : 'aspect-video justify-center flex-col p-4'}`}>
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
