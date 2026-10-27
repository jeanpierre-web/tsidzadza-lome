export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lome',
  }).format(new Date(iso))
}

export const STATUS_LABEL = {
  valide: 'Validé',
  en_attente: 'En attente de modération',
  rejete: 'Rejeté',
} as const
