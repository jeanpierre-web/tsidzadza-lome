import type { Level } from '../types'
import { LEVELS } from '../levels'

/**
 * Photo d'ILLUSTRATION générée (SVG) : une rue stylisée avec une bande d'eau
 * à la hauteur du niveau. Ce n'est PAS une photo réelle ; elle porte la mention TEST.
 */
export function demoPhoto(level: Level, seed: number): string {
  const waterY = { cheville: 132, genou: 108, taille: 80 }[level]
  const c = LEVELS[level].color
  const sky = ['#C9DCDD', '#BFD3D6', '#D4E1DE'][seed % 3]
  const wall = ['#E7D9C4', '#E2CDB3', '#D9C7B0'][seed % 3]
  const door = ['#2E5E6A', '#8A4B2D', '#3D4A5C'][(seed >> 1) % 3]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160">
<rect width="240" height="160" fill="${sky}"/>
<rect x="0" y="40" width="150" height="120" fill="${wall}"/>
<rect x="150" y="58" width="90" height="102" fill="${wall}" opacity=".8"/>
<rect x="28" y="78" width="32" height="62" rx="3" fill="${door}"/>
<rect x="86" y="70" width="40" height="28" rx="3" fill="#F7F3EA" opacity=".9"/>
<rect x="172" y="80" width="26" height="22" rx="3" fill="#F7F3EA" opacity=".8"/>
<path d="M0 ${waterY} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V160 H0z" fill="#5E8C96" opacity=".88"/>
<path d="M0 ${waterY} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="${c}" stroke-width="4"/>
<rect x="14" y="12" width="94" height="20" rx="10" fill="#0B2E36"/>
<text x="61" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#fff" letter-spacing="1">ILLUSTRATION</text>
<rect x="114" y="12" width="42" height="20" rx="10" fill="#FFE14D"/>
<text x="135" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#111">TEST</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
