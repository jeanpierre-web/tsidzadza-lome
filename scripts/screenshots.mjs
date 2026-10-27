// Captures d'écran du prototype (Chrome headless via playwright-core).
// Usage : npm run build && npx vite preview --port 4173 & npm run screenshots
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const OUT = new URL('../screenshots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function clickVisiblePin(page, n = 0) {
  const vp = page.viewportSize()
  const boxes = []
  for (const el of await page.locator('.ts-pin').all()) {
    const b = await el.boundingBox()
    if (b && b.x > 60 && b.y > 220 && b.x < vp.width - 60 && b.y < vp.height - 200) boxes.push(b)
  }
  const b = boxes[Math.min(n, boxes.length - 1)]
  await page.mouse.click(b.x + 11, b.y + 11)
}
const tiles = async (page) => { await page.waitForLoadState('networkidle').catch(() => {}); await wait(2200) }

async function mobile() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, geolocation: { latitude: 6.1431, longitude: 1.2472 }, permissions: ['geolocation'], locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE + '#/'); await tiles(page)
  await page.screenshot({ path: OUT + 'mobile-01-carte.png' })
  // popup d'un signalement
  await clickVisiblePin(page, 3); await wait(900)
  await page.screenshot({ path: OUT + 'mobile-02-popup.png' })
  // panneau quartiers
  await page.goto(BASE + '#/quartiers'); await wait(700)
  await page.screenshot({ path: OUT + 'mobile-03-quartiers.png' })
  await page.getByRole('button', { name: /Awatamé/ }).first().click(); await tiles(page)
  await page.screenshot({ path: OUT + 'mobile-04-quartier-filtre.png' })
  // parcours Signaler
  await page.goto(BASE + '#/signaler'); await wait(600)
  await page.screenshot({ path: OUT + 'mobile-05-signaler-photo.png' })
  await page.locator('input[type=file][data-source="gallery"]').setInputFiles(new URL('./sample-photo.svg', import.meta.url).pathname); await wait(1200)
  await page.screenshot({ path: OUT + 'mobile-05b-signaler-photo-choisie.png' })
  await page.getByRole('button', { name: /Continuer sans photo|Suivant/ }).click(); await wait(400)
  await page.getByRole('button', { name: /Ma position/ }).click(); await tiles(page)
  await page.screenshot({ path: OUT + 'mobile-06-signaler-lieu.png' })
  await page.getByRole('button', { name: 'Suivant' }).click(); await wait(400)
  await page.getByRole('radio', { name: "Eau jusqu'au genou" }).click(); await wait(300)
  await page.screenshot({ path: OUT + 'mobile-07-signaler-niveau.png' })
  await page.getByRole('button', { name: 'Suivant' }).click(); await wait(400)
  await page.screenshot({ path: OUT + 'mobile-08-signaler-verifier.png' })
  await page.getByRole('button', { name: 'Envoyer' }).click(); await wait(500)
  await page.screenshot({ path: OUT + 'mobile-09-signaler-merci.png' })
  await page.goto(BASE + '#/moderation'); await wait(600)
  await page.screenshot({ path: OUT + 'mobile-10-moderation.png' })
  await ctx.close()

  const denied = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR' })
  const deniedPage = await denied.newPage()
  await deniedPage.goto(BASE + '#/signaler'); await wait(500)
  await deniedPage.getByRole('button', { name: /Continuer sans photo|Suivant/ }).click()
  await deniedPage.getByRole('button', { name: /Ma position/ }).click()
  await deniedPage.getByRole('alert').waitFor({ timeout: 15000 })
  await deniedPage.screenshot({ path: OUT + 'mobile-06b-signaler-lieu-refuse.png' })
  await denied.close()
}

async function desktop() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE + '#/'); await tiles(page)
  await page.screenshot({ path: OUT + 'desktop-01-carte.png' })
  await clickVisiblePin(page, 8); await wait(900)
  await page.screenshot({ path: OUT + 'desktop-02-popup.png' })
  await ctx.close()
}

await mobile()
await desktop()
await browser.close()
console.log('Captures enregistrées dans', OUT)
