import { writeFileSync } from 'node:fs'
import { demoSeedSql } from '../src/data/demoSeed'

writeFileSync(new URL('../supabase/seed-demo.sql', import.meta.url), demoSeedSql())
console.log('supabase/seed-demo.sql')