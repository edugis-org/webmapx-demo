/**
 * Assembles webmapx.com from a built webmapx checkout: webmapx's test pages,
 * assets, configs, plugins and data, plus this repository's landing page, demo
 * app, tool documentation and the coastal zones data.
 *
 * One script, used by both places that build this site: this repository's
 * pages.yml (with webmapx at the commit site.lock pins) and webmapx's
 * previews.yml (with webmapx at the branch being previewed), so a preview is
 * put together exactly the way the published site is and the two cannot drift.
 *
 *   tsx scripts/assemble-site.ts <webmapx-checkout> <out-dir>
 *
 * The checkout must already have run `npm run build` and `npm run build:lib`,
 * with its public/config holding the configs to serve.
 *
 * Environment:
 *   APIKEYS_JSON         written to <out>/config/apikeys.json when set
 *   SITE_WEBMAPX_COMMIT  \  passed to build:tool-docs for the page footers;
 *   SITE_CONFIGS_COMMIT  /  default is what site.lock names
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

// Data too large to keep in git, published as release assets by the repository
// that builds them. Release downloads carry no CORS headers, so a browser
// cannot read them where they are: they are copied here and served by Pages,
// which answers the HTTP range requests PMTiles needs. Pinned by tag and
// checksum, like site.lock pins the code: a rebuilt archive reaches the site
// through a commit here, never by itself. Paths are where the configs expect
// them: `pmtiles://../data/…` from config/. The GeoJSON is the same zones for
// engines that cannot read PMTiles (OpenLayers).
const COASTAL_ZONES_TAG = 'v2026.09.27';
const COASTAL_ZONES: Record<string, string> = {
    'coastal_zones.pmtiles': 'e8f2f2e0c63fea4ec4e83a4b7f27d687e06703e8da9f9a555ec97f65daca548e',
    'coastal_zones_16m.geojson': '860c65681084d49c4be6a1a2c2f7329d40dee0c33bc1e05298058f79fb217a9d',
};

/** `cp -R from/. to/`: the contents of `from` merged into `to`. */
function copyInto(from: string, to: string): void {
    mkdirSync(to, { recursive: true });
    cpSync(from, to, { recursive: true });
}

async function fetchCoastalZones(dataDir: string): Promise<void> {
    mkdirSync(dataDir, { recursive: true });
    for (const [file, sha256] of Object.entries(COASTAL_ZONES)) {
        const url = `https://github.com/edugis-org/coastal_zones/releases/download/${COASTAL_ZONES_TAG}/${file}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        const actual = createHash('sha256').update(bytes).digest('hex');
        if (actual !== sha256) throw new Error(`${file}: checksum ${actual}, expected ${sha256}`);
        writeFileSync(join(dataDir, file), bytes);
    }
}

async function main(): Promise<void> {
    const [webmapxArg, outArg] = process.argv.slice(2);
    if (!webmapxArg || !outArg) {
        console.error('Usage: tsx scripts/assemble-site.ts <webmapx-checkout> <out-dir>');
        process.exit(1);
    }
    const webmapx = resolve(webmapxArg);
    const built = join(webmapx, 'dist');
    const out = resolve(outArg);
    for (const required of [built, join(webmapx, 'dist-lib')]) {
        if (!existsSync(required)) throw new Error(`${required} is missing: run npm run build and npm run build:lib in ${webmapx}`);
    }

    // Per-tool documentation pages, regenerated here so they carry the commit
    // this build is made from and the config fragments of the configs it
    // serves — never a committed copy that could describe another version.
    execFileSync('npm', ['run', 'build:tool-docs'], {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, WEBMAPX_DIST_LIB: join(webmapx, 'dist-lib') },
    });

    // Test pages (setup + preview) and their bundled assets from the webmapx build.
    copyInto(join(built, 'testpages'), join(out, 'testpages'));
    copyInto(join(built, 'assets'), join(out, 'assets'));
    // The library build, for the demo app.
    copyInto(join(webmapx, 'dist-lib'), join(out, 'dist-lib'));
    // Configs: whatever the checkout's public/config held when it was built —
    // for the published site, the commit site.lock pins.
    copyInto(join(built, 'config'), join(out, 'config'));
    // Example plugins (public/plugins in webmapx). A config names one by a path
    // relative to itself, so from config/ `../plugins/…` has to resolve here.
    // Guarded: a webmapx commit from before plugins shipped has none to copy.
    if (existsSync(join(built, 'plugins'))) copyInto(join(built, 'plugins'), join(out, 'plugins'));

    // The landing page and demo app from this repository.
    for (const file of ['index.html', 'demos.js', 'favicon.png', 'llms.txt']) {
        cpSync(join(ROOT, file), join(out, file));
    }
    copyInto(join(ROOT, 'tools'), join(out, 'tools'));
    // Pre-rendered map screenshots shown while the demo iframes load
    // (generated by `npm run updateMapPreviews`, committed to this repo).
    copyInto(join(ROOT, 'previews'), join(out, 'previews'));
    copyInto(join(ROOT, 'demo'), join(out, 'demo'));
    copyInto(join(built, 'data'), join(out, 'demo', 'data'));
    copyInto(join(built, 'data'), join(out, 'testpages', 'data'));

    // API keys, once, beside the configs that use them. The keys file is found
    // relative to the *config* (`apiKeysFile`, default ./apikeys.json), so one
    // copy here serves every config in the directory and every page that shows
    // one. Optional: without it every visitor's console shows a 404.
    if (process.env.APIKEYS_JSON) writeFileSync(join(out, 'config', 'apikeys.json'), process.env.APIKEYS_JSON);

    await fetchCoastalZones(join(out, 'data'));
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
