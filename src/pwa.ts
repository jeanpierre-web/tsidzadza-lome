/** Enregistre le service worker du build (GitHub Pages, base relative). Ignoré en dev. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* L'application reste utilisable sans installation. */
    })
  })
}
