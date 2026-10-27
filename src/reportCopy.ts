/** Texte de l'étape « vérifier », selon que les signalements quittent le téléphone ou non. */
export function reviewNotice(shared: boolean): string {
  if (shared) {
    return 'Une personne vérifiera le signalement avant de le valider. Il est marqué TEST et envoyé sur la carte partagée.'
  }
  return 'Une personne vérifiera le signalement avant de le valider. Prototype : il est enregistré uniquement sur cet appareil et marqué TEST.'
}

export function thanksDetail(opts: { shared: boolean; pendingSync: boolean; photoDropped: boolean }): string {
  if (opts.pendingSync) {
    return 'Pas de réseau. Le signalement est gardé sur ce téléphone et partira tout seul dès que la connexion revient.'
  }
  const where = opts.shared ? 'sur la carte partagée' : 'sur la carte de cet appareil'
  const photo = opts.photoDropped ? " La photo n'a pas pu partir, le signalement oui." : ''
  return `Il est en attente de modération et apparaît en pointillés ${where}.${photo}`
}
