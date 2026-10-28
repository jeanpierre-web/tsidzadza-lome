// Après vite build : inscrit dans dist/sw.js la liste des fichiers à garder hors ligne.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full, rel))
    else out.push('./' + rel)
  }
  return out
}

const files = walk('dist').filter((file) => file !== './sw.js')
const path = 'dist/sw.js'
const sw = readFileSync(path, 'utf8')
const next = sw.replace('const PRECACHE = []', `const PRECACHE = ${JSON.stringify(files)}`)
if (next === sw) throw new Error('dist/sw.js : marqueur PRECACHE introuvable')
writeFileSync(path, next)
console.log('Service worker :', files.length, 'fichiers en cache')
