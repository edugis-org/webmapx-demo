/**
 * `npm run updateMapPreviews`
 *
 * Screenshots every demo in demos.js and writes previews/<id>.jpg. The landing
 * page shows those images while the real (iframed) map is still booting, so the
 * grid looks like maps from the first paint.
 *
 * The output is committed to the repo and served as plain static files — this
 * script is a one-off authoring tool, not part of the site build.
 *
 * Usage:
 *   npm run updateMapPreviews              # all demos
 *   npm run updateMapPreviews -- volcano   # only ids containing "volcano"
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { startServer, ROOT } from './static-server.ts';
import { DEMOS } from '../demos.js';

/** Card aspect on the landing page is roughly 2:1; 1.5x keeps it sharp enough
 *  for a placeholder at well under 100 kB per image. */
const WIDTH = 700;
const HEIGHT = 340;
const SCALE = 1.5;
const JPEG_QUALITY = 62;

/** Time budget per demo: engine boot + tile fetches. */
const NETWORK_IDLE_TIMEOUT = 25_000;
/** Extra settle time after network idle — tiles decode/paint after the last response. */
const SETTLE_MS = 2_500;

const OUT_DIR = fileURLToPath(new URL('../previews/', import.meta.url));

const filters = process.argv.slice(2);
const demos = filters.length
  ? DEMOS.filter((d) => filters.some((f) => d.id.includes(f)))
  : DEMOS;

if (!demos.length) {
  console.error(`No demo matched ${filters.join(', ')}. Known ids: ${DEMOS.map((d) => d.id).join(', ')}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const { server, url } = await startServer(0);
console.log(`serving ${ROOT} at ${url}`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
  // Screenshots are the site's own light-themed look; don't inherit the CI host's
  // dark preference, which would make posters mismatch the loaded map.
  colorScheme: 'light',
});

let failures = 0;

for (const demo of demos) {
  const page = await context.newPage();
  const target = `${url}/demo/index.html?config=../${demo.config}`;
  process.stdout.write(`${demo.id} … `);

  try {
    await page.goto(target, { waitUntil: 'load', timeout: NETWORK_IDLE_TIMEOUT });
    try {
      await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT });
    } catch {
      // Some engines keep polling (globe animation, live sources) and never go
      // idle. The settle wait below still gives a representative frame.
      process.stdout.write('(no network idle) ');
    }
    await page.waitForTimeout(SETTLE_MS);

    const errorText = await page.locator('#error').innerText().catch(() => '');
    if (errorText.trim()) throw new Error(errorText.trim());

    const buffer = await page.screenshot({ type: 'jpeg', quality: JPEG_QUALITY });
    const file = join(OUT_DIR, `${demo.id}.jpg`);
    await writeFile(file, buffer);
    console.log(`ok — ${(buffer.byteLength / 1024).toFixed(0)} kB`);
  } catch (e) {
    failures++;
    console.log(`FAILED — ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

if (failures) {
  console.error(`${failures} of ${demos.length} previews failed; existing images left untouched.`);
  process.exit(1);
}
console.log(`Wrote ${demos.length} preview(s) to previews/`);
