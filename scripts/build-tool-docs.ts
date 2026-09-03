/**
 * Builds the per-tool documentation pages under `tools/`.
 *
 * One page per tool, static HTML, one URL each — a tool that cannot be linked
 * to cannot be shared, cited, or found, and a single "pick a tool" page has
 * exactly one URL for all of them.
 *
 * Three inputs, none of them duplicated:
 *   - TOOL_REGISTRY (dist-lib/webmapx-config.js) says which tools exist and
 *     what they are called. Never retyped here: a tool with no page is a build
 *     error, so adding one upstream cannot silently go undocumented.
 *   - docs/tools/<id>.md is the prose, in fixed sections (see SECTIONS).
 *   - the demo config named in the front matter supplies the *live map* and the
 *     copy-paste config fragment, cut from the real file so it cannot drift.
 *
 * Every page is emitted twice: as HTML for people, and as JSON for agents and
 * scripts (plus tools/index.json and llms.txt). Same data, no second prose.
 *
 *   npm run build:tool-docs            # all tools that have a page
 *   npm run build:tool-docs -- --check # fail if a registry tool has no page
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DOCS_DIR = join(ROOT, 'docs', 'tools');
const OUT_DIR = join(ROOT, 'tools');

/** Where a config path in front matter is looked up, in order. */
const CONFIG_ROOTS = [ROOT, resolve(ROOT, '..', 'webmapx-configs', '..')];

const SITE = 'https://webmapx.com';

/**
 * Where the built webmapx keeps the Shoelace icon files. In CI the checkout is
 * addressed through WEBMAPX_DIST_LIB, whose parent is that build.
 */
const ICON_DIRS = [
    ...(process.env.WEBMAPX_DIST_LIB
        ? [resolve(process.env.WEBMAPX_DIST_LIB, '..', 'dist', 'shoelace-assets', 'assets', 'icons')]
        : []),
    resolve(ROOT, '..', 'webmapx', 'dist', 'shoelace-assets', 'assets', 'icons'),
    resolve(ROOT, '..', 'webmapx', 'node_modules', '@shoelace-style', 'shoelace', 'dist', 'assets', 'icons'),
];

/** The four audiences, as four sections, always in this order. */
const SECTIONS = [
    { key: 'what', title: 'What it does' },
    { key: 'use', title: 'Using it' },
    { key: 'embed', title: 'In your own map' },
    { key: 'extend', title: 'Extending it' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

interface ToolDoc {
    id: string;
    tagline: string;
    status: string;
    config?: string;
    source: string[];
    tests: string[];
    related: string[];
    sections: Record<string, string>;
}

// ── front matter ────────────────────────────────────────────────────────────
// A deliberately small subset of YAML: `key: value`, `key: [a, b]`, and
// `key:` followed by `  - item` lines. Enough for what a doc page declares,
// and it keeps the build free of dependencies.

function parseFrontMatter(text: string): { meta: Record<string, string | string[]>; body: string } {
    if (!text.startsWith('---\n')) throw new Error('missing front matter');
    const end = text.indexOf('\n---\n', 3);
    if (end === -1) throw new Error('unterminated front matter');
    const meta: Record<string, string | string[]> = {};
    let key: string | null = null;
    for (const line of text.slice(4, end).split('\n')) {
        if (!line.trim()) continue;
        const item = /^\s+-\s+(.*)$/.exec(line);
        if (item && key) {
            (meta[key] as string[]).push(item[1].trim());
            continue;
        }
        const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
        if (!kv) throw new Error(`front matter line not understood: ${line}`);
        key = kv[1];
        const value = kv[2].trim();
        if (value === '') meta[key] = [];
        else if (value.startsWith('[') && value.endsWith(']'))
            meta[key] = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
        else meta[key] = value;
    }
    return { meta, body: text.slice(end + 5) };
}

function splitSections(body: string): Record<string, string> {
    const out: Record<string, string> = {};
    let current: string | null = null;
    let buffer: string[] = [];
    const flush = () => { if (current) out[current] = buffer.join('\n').trim(); };
    for (const line of body.split('\n')) {
        const heading = /^##\s+(\S+)\s*$/.exec(line);
        if (heading) {
            flush();
            current = heading[1];
            buffer = [];
        } else buffer.push(line);
    }
    flush();
    return out;
}

// ── markdown ────────────────────────────────────────────────────────────────
// Paragraphs, lists (ordered and not), fenced code, and inline emphasis/code/
// links. The prose here is prose; anything needing more markdown than this is
// a sign the page is trying to be a manual.

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s: string): string {
    return escapeHtml(s)
        .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

function markdown(md: string): string {
    const out: string[] = [];
    const lines = md.split('\n');
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

        if (line.startsWith('```')) {
            const code: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
            i++;
            out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
            continue;
        }

        const ordered = /^\d+\.\s/.test(line);
        const bulleted = /^[-*]\s/.test(line);
        if (ordered || bulleted) {
            const tag = ordered ? 'ol' : 'ul';
            const items: string[] = [];
            while (i < lines.length && lines[i].trim()) {
                const start = ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/;
                const m = start.exec(lines[i]);
                if (m) items.push(m[1]);
                else if (items.length) items[items.length - 1] += ' ' + lines[i].trim();
                i++;
            }
            out.push(`<${tag}>${items.map(t => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
            continue;
        }

        const para: string[] = [];
        while (i < lines.length && lines[i].trim() && !/^(```|[-*]\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
        out.push(`<p>${inline(para.join(' '))}</p>`);
    }
    return out.join('\n');
}


/**
 * The tool's own icon, inlined as SVG.
 *
 * Inlined rather than linked: these pages are static and carry no Shoelace, and
 * an <sl-icon> would fetch from a CDN at read time for a 300-byte glyph. The
 * file comes from the same pinned webmapx build the registry does, so a tool
 * whose icon changes upstream changes here too.
 *
 * A missing icon is not an error — the page renders without one and the build
 * says which tool it was.
 */
type ToolIcon = string | { src?: string } | undefined;

/** Normalises a raw <svg> so it follows the heading it sits in and both themes. */
function inlineIconSvg(svg: string): string {
    const cleaned = svg
        .replace(/<\?xml[^>]*\?>/, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();

    // Sized in em so the icon follows the heading it sits in. The size is
    // *set*, not substituted: a replace only works on an icon that already
    // declares width and height, and the ones drawn for this project declare
    // neither — they carry a viewBox and nothing else, so the old rule left
    // them unsized and they rendered as nothing at all in the page title. The
    // quoting varies too (`stroke-width='95'` in single quotes), which is why
    // both forms are stripped before the em sizes go on.
    const sized = cleaned.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
        const withoutSize = attrs
            .replace(/\swidth\s*=\s*("[^"]*"|'[^']*')/gi, '')
            .replace(/\sheight\s*=\s*("[^"]*"|'[^']*')/gi, '');
        return `<svg${withoutSize} width="1em" height="1em">`;
    });

    return `<span class="tool-icon" aria-hidden="true">${sized}</span>`;
}

function toolIconSvg(icon: ToolIcon): string {
    // A registry icon is usually a Shoelace icon name, but a tool with artwork
    // of its own carries `{ src }` — and the bundler inlines that as a
    // `data:image/svg+xml` URL, so the drawing is right here rather than in a
    // file this build would have to go and find.
    if (icon && typeof icon === 'object') {
        const src = icon.src ?? '';
        const marker = 'data:image/svg+xml,';
        if (!src.startsWith(marker)) return '';
        try {
            return inlineIconSvg(decodeURIComponent(src.slice(marker.length)));
        } catch {
            return '';
        }
    }
    const name = icon;
    if (!name) return '';
    for (const dir of ICON_DIRS) {
        const file = join(dir, `${name}.svg`);
        if (!existsSync(file)) continue;
        return inlineIconSvg(readFileSync(file, 'utf8'));
    }
    console.log(`no icon file for "${name}"`);
    return '';
}

// ── inputs ──────────────────────────────────────────────────────────────────

function readLock(): { webmapx: string; configs: string } {
    const lock = JSON.parse(readFileSync(join(ROOT, 'site.lock'), 'utf8'));
    return { webmapx: lock.webmapx.commit, configs: lock.configs.commit };
}

/** Locate the config named in front matter, in the sibling config checkout or here. */
function findConfig(path: string): string | null {
    const candidates = [
        join(ROOT, path),
        resolve(ROOT, '..', 'webmapx-configs', path.replace(/^config\//, '')),
    ];
    return candidates.find(existsSync) ?? null;
}

/**
 * The config fragment that adds this tool, cut from the demo config itself —
 * its `tools.<id>` section plus the toolbar entry that gives it a button. Cut
 * rather than written out, so the snippet on the page is the snippet that runs.
 */
function configFragment(configPath: string, toolId: string): string | null {
    const file = findConfig(configPath);
    if (!file) return null;
    const config = JSON.parse(readFileSync(file, 'utf8'));
    const tools = config.tools ?? {};
    const section = Object.entries(tools).find(([key, value]: [string, any]) =>
        key === toolId || value?.type === toolId);
    if (!section) return null;

    const fragment: Record<string, unknown> = { [section[0]]: section[1] };
    for (const [key, value] of Object.entries<any>(tools)) {
        if (value?.type !== 'toolbar' || !Array.isArray(value.items)) continue;
        const items = value.items.filter((item: any) => item?.type === toolId);
        if (items.length) fragment[key] = { ...value, items };
    }
    return JSON.stringify({ tools: fragment }, null, 2);
}

function loadDocs(): ToolDoc[] {
    if (!existsSync(DOCS_DIR)) return [];
    return readdirSync(DOCS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(file => {
            const id = file.replace(/\.md$/, '');
            const { meta, body } = parseFrontMatter(readFileSync(join(DOCS_DIR, file), 'utf8'));
            const list = (key: string) => (Array.isArray(meta[key]) ? (meta[key] as string[]) : []);
            return {
                id,
                tagline: String(meta.tagline ?? ''),
                status: String(meta.status ?? 'stable'),
                config: meta.config ? String(meta.config) : undefined,
                source: list('source'),
                tests: list('tests'),
                related: list('related'),
                sections: splitSections(body),
            };
        })
        .sort((a, b) => a.id.localeCompare(b.id));
}

// ── rendering ───────────────────────────────────────────────────────────────

const STYLE = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f8f8f8;color:#1a1a1a;line-height:1.6}
a{color:#1b6ec2}
header{background:#0f1923;color:#fff;padding:2rem 1.5rem}
header .inner,main{max-width:52rem;margin:0 auto}
header .crumb{font-size:.85rem;color:#8fa6bd}
header .crumb a{color:#8fa6bd}
header h1{font-size:2rem;letter-spacing:-.02em;margin:.4rem 0;display:flex;align-items:center;gap:.55rem}
.tool-icon{display:inline-flex;align-items:center;flex:none}
.tool-link{display:inline-flex;align-items:center;gap:.45rem}
header p{color:#aac;max-width:42rem}
.badges{margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap}
.badge{font-size:.75rem;border:1px solid #2e4358;color:#cfe0f0;border-radius:99px;padding:.15rem .6rem}
.mapwrap{max-width:52rem;margin:1.5rem auto;height:26rem;border:1px solid #d8d8d8;border-radius:8px;overflow:hidden;background:#e9e9e9}
.mapwrap iframe{width:100%;height:100%;border:0;display:block}
.mapwrap .fallback{padding:2rem;font-size:.9rem;color:#555}
main{padding:0 1.5rem 4rem}
section{margin-top:2.5rem}
/* The tools that exist but have no page yet, listed quietly under their own
   group rather than in one lump at the bottom: a reader looking for a control
   should find out there is one, in the place they were already looking. */
.pending{margin-top:.8rem;font-size:.85rem;color:#666}
/* One worked example, two pictures and a table. The colours are the tool's own:
   the first layer neutral, the second layer the accent, the result filled. */
.io{display:flex;flex-wrap:wrap;gap:1rem;align-items:center;margin-top:1rem}
.io .arrow{font-size:1.6rem;color:#888;flex:0 0 auto}
.map-figure{margin:0;flex:0 0 auto}
.map-figure svg{background:#eef3f7;border:1px solid #d8d8d8;border-radius:4px;display:block}
.map-figure figcaption{font-size:.75rem;color:#666;margin-top:.25rem}
svg .a{fill:#c9d6e0;stroke:#7d8f9d;stroke-width:.5}
svg .ghost{fill:#eceff2;stroke:#dfe4e8;stroke-width:.5}
svg .b{fill:rgba(217,99,60,.18);stroke:#d9633c;stroke-width:1.2}
svg .out{fill:rgba(43,108,143,.55);stroke:#1b4a63;stroke-width:.8}
svg .pt{fill:#1b4a63;stroke:#fff;stroke-width:1}
table.attrs{font-size:.8rem;margin-top:.6rem;width:auto;border-collapse:collapse}
table.attrs th,table.attrs td{border:1px solid #ddd;padding:.2rem .5rem;text-align:left}
table.attrs th{background:#f0f2f4}
table.attrs td.null{color:#aaa;font-style:italic}
p.fields{font-size:.85rem;color:#555;margin-top:.8rem}
.scroll{overflow-x:auto}
table.matrix{font-size:.8rem;border-collapse:collapse;margin-top:.6rem;width:auto}
table.matrix th,table.matrix td{border:1px solid #ddd;padding:.25rem .5rem;text-align:center}
table.matrix th.op{text-align:left;white-space:nowrap;font-weight:600}
table.matrix th.sub{font-weight:400;color:#666;font-size:.75rem}
table.matrix thead th{background:#f0f2f4}
.yes{color:#2f7d4f;font-weight:700}
.none{color:#999}
.err{color:#b03030;font-weight:700}
p.legend{font-size:.85rem;color:#555;margin-top:.6rem}
.no-geom{width:300px;height:180px;display:flex;align-items:center;justify-content:center;text-align:center;
  background:#f4f6f8;border:1px dashed #cfd6dc;border-radius:4px;color:#7a848c;font-size:.85rem}
p.pagenav{font-size:.9rem;margin-top:1.2rem;padding-bottom:.6rem;border-bottom:1px solid #e2e2e2}
.pending code{background:#ececec;padding:.1em .35em;border-radius:3px}
h2{font-size:1.3rem;letter-spacing:-.01em;margin-bottom:.6rem}
p+p,p+ul,p+ol,ul+p,ol+p,pre+p{margin-top:.8rem}
li{margin-left:1.2rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;background:#ececec;padding:.1em .35em;border-radius:3px}
pre{background:#0f1923;color:#dfe8f0;padding:1rem;border-radius:6px;overflow-x:auto;margin-top:.8rem}
pre code{background:none;color:inherit;padding:0}
table{border-collapse:collapse;width:100%;margin-top:.8rem;font-size:.9rem}
th,td{text-align:left;padding:.4rem .6rem;border-bottom:1px solid #ddd;vertical-align:top}
footer{border-top:1px solid #ddd;margin-top:3rem;padding-top:1rem;font-size:.85rem;color:#666}
@media (prefers-color-scheme:dark){
 body{background:#12181e;color:#e6ebf0}a{color:#6db8ff}
 .mapwrap{border-color:#25313d;background:#1a222a}
 code{background:#222c36}th,td{border-color:#25313d}footer{border-color:#25313d;color:#9aa8b5}
}
`;

function page(body: string, opts: { title: string; description: string; canonical: string; alternate?: string }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}">
<link rel="canonical" href="${opts.canonical}">
${opts.alternate ? `<link rel="alternate" type="application/json" href="${opts.alternate}">` : ''}
<link rel="icon" href="../favicon.png" type="image/png">
<style>${STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function sourceTable(doc: ToolDoc, registry: any, commit: string): string {
    const gh = (path: string) => `https://github.com/edugis-org/webmapx/blob/${commit}/${path}`;
    const rows: string[] = [];
    rows.push(`<tr><th>Config <code>type</code></th><td><code>${doc.id}</code></td></tr>`);
    rows.push(`<tr><th>Element</th><td><code>&lt;${registry.tag}&gt;</code></td></tr>`);
    rows.push(`<tr><th>Placement</th><td>${registry.placement}</td></tr>`);
    if (doc.source.length)
        rows.push(`<tr><th>Source</th><td>${doc.source.map(p => `<a href="${gh(p)}"><code>${p}</code></a>`).join('<br>')}</td></tr>`);
    if (doc.tests.length)
        rows.push(`<tr><th>Tests</th><td>${doc.tests.map(p => `<a href="${gh(p)}"><code>${p}</code></a>`).join('<br>')}</td></tr>`);
    if (doc.related.length)
        rows.push(`<tr><th>Related</th><td>${doc.related.map(id => `<a href="./${id}.html">${id}</a>`).join(', ')}</td></tr>`);
    return `<table>${rows.join('')}</table>`;
}

function renderTool(doc: ToolDoc, registry: any, lock: { webmapx: string; configs: string }): string {
    // `testpages/preview.html`, not `demo/index.html`: the demo host resolves the
    // engines through an importmap against a CDN, which works for MapLibre and
    // falls apart for OpenLayers — `ol/ol.css` is served as a stylesheet the
    // browser refuses to run as a module, and proj4's registrations land in a
    // second copy of `ol/proj`, so a map in any projection dies in OL's own
    // code. The preview page is built from the bundled app, where there is one
    // copy of everything. `storageKey` is deliberately a name nothing writes:
    // preview.html prefers a config saved in localStorage, and a reader who has
    // used setup.html would otherwise see their own map on every tool page.
    const map = doc.config
        // `allow="fullscreen"` so a demo carrying the fullscreen control works.
        // Chromium grants it to a same-origin frame by default; the attribute is
        // what stops that from being a browser-by-browser gamble.
        ? `<div class="mapwrap"><iframe loading="lazy" allow="fullscreen" title="${escapeHtml(registry.label)} demo map"
     src="../testpages/preview.html?storageKey=webmapx-docs-no-override&config=../${doc.config}"></iframe></div>`
        : '';

    const fragment = doc.config ? configFragment(doc.config, doc.id) : null;
    const sections = SECTIONS.map(({ key, title }) => {
        const md = doc.sections[key as SectionKey];
        const auto = key === 'embed' && fragment
            ? `<pre><code>${escapeHtml(fragment)}</code></pre>`
            : key === 'extend'
                ? sourceTable(doc, registry, lock.webmapx)
                : '';
        if (!md && !auto) return '';
        return `<section id="${key}"><h2>${title}</h2>${md ? markdown(md) : ''}${auto}</section>`;
    }).join('\n');

    const body = `<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a></div>
<h1>${toolIconSvg(registry.icon)}${escapeHtml(registry.label)}</h1>
<p>${inline(doc.tagline)}</p>
<div class="badges"><span class="badge">type: ${doc.id}</span><span class="badge">${registry.placement}</span><span class="badge">${doc.status}</span></div>
</div></header>
${map}
<main>${sections}
<footer>Built from webmapx <code>${lock.webmapx.slice(0, 7)}</code> and configs <code>${lock.configs.slice(0, 7)}</code>.
Machine-readable: <a href="./${doc.id}.json">${doc.id}.json</a>.</footer>
</main>`;

    return page(body, {
        title: `${registry.label} — WebMapX tool`,
        description: doc.tagline,
        canonical: `${SITE}/tools/${doc.id}.html`,
        alternate: `./${doc.id}.json`,
    });
}

/**
 * The worked example behind the analysis page.
 *
 * Built by `npm run build:analysis-examples` in the webmapx checkout, which
 * runs every operation through the real GDAL/SpatiaLite WASM against real
 * Natural Earth countries. Nothing on the page is drawn by hand: the shapes
 * are the operations' own output, so a change in what clip does changes the
 * picture rather than dating the prose beside it.
 */
interface AnalysisExample {
    id: string;
    operation: string;
    title: string;
    twoInput: boolean;
    params?: Record<string, string | number>;
    note: string;
    featureCount: number;
    fields: string[];
    result: any;
}

/**
 * The figure's frame, in lon/lat.
 *
 * Wide enough for every result, not just the inputs: a buffer grows past the
 * coast and a cartogram grows past that, and a frame fitted to the countries
 * alone quietly cropped France's southern half out of every picture — including
 * the ones meant to show that a shape had changed size.
 */
const FIGURE_BOX = { west: -13.5, south: 40.5, east: 10.5, north: 62 };
const FIGURE_W = 300;

type Projector = ((lon: number, lat: number) => [number, number]) & { figureHeight: number };

function projectLonLat(lon: number, lat: number): [number, number] {
    // Web Mercator, so the shapes look like the map the reader knows.
    const y = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI / 180) / 2));
    const x0 = FIGURE_BOX.west, x1 = FIGURE_BOX.east;
    const y0 = y(FIGURE_BOX.north), y1 = y(FIGURE_BOX.south);
    const h = FIGURE_W * (y0 - y1) / ((x1 - x0) * Math.PI / 180);
    return [
        (lon - x0) / (x1 - x0) * FIGURE_W,
        (y0 - y(lat)) / (y0 - y1) * h,
    ];
}

const MERCATOR: Projector = Object.assign(projectLonLat, {
    figureHeight: Math.round(projectLonLat(FIGURE_BOX.west, FIGURE_BOX.south)[1]),
});

/**
 * Lambert azimuthal equal-area on the frame's own centre.
 *
 * Mercator inflates area by 1/cos²(latitude), which over this frame alone makes
 * the United Kingdom about a third larger against France than it is. For most
 * operations that is a shape the reader recognises and nothing more; for a
 * cartogram it contradicts the result, since the whole claim is that area is
 * the value. Same uniform scale in both directions, so an area on the page is
 * an area on the ground.
 */
const EQUAL_AREA: Projector = (() => {
    const rad = Math.PI / 180;
    const lon0 = (FIGURE_BOX.west + FIGURE_BOX.east) / 2 * rad;
    const lat0 = (FIGURE_BOX.south + FIGURE_BOX.north) / 2 * rad;
    const raw = (lon: number, lat: number): [number, number] => {
        const p = lat * rad, l = lon * rad - lon0;
        const k = Math.sqrt(2 / (1 + Math.sin(lat0) * Math.sin(p) + Math.cos(lat0) * Math.cos(p) * Math.cos(l)));
        return [k * Math.cos(p) * Math.sin(l), k * (Math.cos(lat0) * Math.sin(p) - Math.sin(lat0) * Math.cos(p) * Math.cos(l))];
    };
    // Fit the same lon/lat frame, sampling its edges: a straight edge in lon/lat
    // is a curve here, so the corners alone would crop.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const lon = FIGURE_BOX.west + t * (FIGURE_BOX.east - FIGURE_BOX.west);
        const lat = FIGURE_BOX.south + t * (FIGURE_BOX.north - FIGURE_BOX.south);
        for (const [a, b] of [[lon, FIGURE_BOX.south], [lon, FIGURE_BOX.north], [FIGURE_BOX.west, lat], [FIGURE_BOX.east, lat]] as Array<[number, number]>) {
            const [x, y] = raw(a, b);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
    }
    const scale = FIGURE_W / (maxX - minX);
    const project = (lon: number, lat: number): [number, number] => {
        const [x, y] = raw(lon, lat);
        return [(x - minX) * scale, (maxY - y) * scale];
    };
    return Object.assign(project, { figureHeight: Math.round((maxY - minY) * scale) });
})();

function geometryPath(geometry: any, project: Projector): string {
    if (!geometry) return '';
    const rings: number[][][] = geometry.type === 'MultiPolygon'
        ? geometry.coordinates.flat()
        : geometry.type === 'Polygon' ? geometry.coordinates
        : geometry.type === 'MultiLineString' ? geometry.coordinates.map((c: any) => c)
        : geometry.type === 'LineString' ? [geometry.coordinates]
        : [];
    return rings.map((ring) => ring.map((pos, i) => {
        const [x, y] = project(pos[0], pos[1]);
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join('') + 'Z').join(' ');
}

function pointMarkers(fc: any, project: Projector): string {
    const out: string[] = [];
    for (const f of fc.features ?? []) {
        const g = f.geometry;
        const points = g?.type === 'Point' ? [g.coordinates]
            : g?.type === 'MultiPoint' ? g.coordinates : [];
        for (const p of points) {
            const [x, y] = project(p[0], p[1]);
            out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" class="pt"/>`);
        }
    }
    return out.join('');
}

function figure(layers: Array<{ fc: any; cls: string }>, caption: string, project: Projector = MERCATOR): string {
    const h = project.figureHeight;
    const paths = layers.map(({ fc, cls }) => {
        const d = (fc.features ?? []).map((f: any) => geometryPath(f.geometry, project)).filter(Boolean).join(' ');
        return (d ? `<path d="${d}" class="${cls}"/>` : '') + pointMarkers(fc, project);
    }).join('');
    return `<figure class="map-figure">
<svg viewBox="0 0 ${FIGURE_W} ${h}" width="${FIGURE_W}" height="${h}" role="img" aria-label="${escapeHtml(caption)}">${paths}</svg>
<figcaption>${escapeHtml(caption)}</figcaption>
</figure>`;
}

function attributeTable(fc: any, fields: string[]): string {
    const rows = (fc.features ?? []).map((f: any) => {
        const cells = fields.map((k) => {
            const v = f.properties?.[k];
            const empty = v === null || v === undefined || v === '';
            return `<td${empty ? ' class="null"' : ''}>${empty ? 'NULL' : escapeHtml(String(v))}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="attrs"><thead><tr>${fields.map(f => `<th>${escapeHtml(f)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

/** The three analysis pages know about each other, so a reader can move between them. */
const ANALYSIS_PAGES: Array<{ file: string; label: string }> = [
    { file: 'analysis-operations.html', label: 'Two-layer operations' },
    { file: 'analysis-single-layer.html', label: 'One-layer operations' },
    { file: 'analysis-geometry.html', label: 'Which geometry each takes' },
];

function analysisNav(current: string): string {
    const links = ANALYSIS_PAGES.map(pageLink => (pageLink.file === current
        ? `<strong>${escapeHtml(pageLink.label)}</strong>`
        : `<a href="./${pageLink.file}">${escapeHtml(pageLink.label)}</a>`)).join(' · ');
    return `<p class="pagenav">${links}</p>`;
}

interface SupportRow { operation: string; label: string; twoInput: boolean; cells: Record<string, 'ok' | 'empty' | 'error'>; }

const GEOM_KINDS = ['point', 'line', 'polygon'] as const;
const SUPPORT_MARK: Record<string, { glyph: string; cls: string; title: string }> = {
    ok: { glyph: '●', cls: 'yes', title: 'returns features' },
    empty: { glyph: '○', cls: 'none', title: 'runs, but the answer is empty for this combination' },
    error: { glyph: '×', cls: 'err', title: 'refuses this geometry' },
};

/**
 * What each operation accepts, measured rather than declared.
 *
 * Nothing in the registry says which geometry an operation takes — the tool
 * offers every layer on the map — so each cell here is one real run against the
 * real SpatiaLite, recorded as it came back.
 */
function renderGeometryPage(support: SupportRow[], lock: { webmapx: string }): string {
    return page(`<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a> / <a href="./geoprocessing.html">Analysis</a></div>
<h1>Which geometry each operation takes</h1>
<p>Points, lines and polygons, and what every analysis operation does with them — measured by running each combination rather than read off a specification.</p>
</div></header>
<main>${analysisNav('analysis-geometry.html')}${renderSupportMatrix(support)}
<footer>Generated from webmapx <code>${lock.webmapx.slice(0, 9)}</code> by running each operation; see <a href="./geoprocessing.html">the analysis tool</a>.</footer>
</main>`, {
        title: 'Analysis — which geometry each operation takes',
        description: 'Which geometry types each webmapx analysis operation accepts for its first and second layer, measured by running every combination.',
        canonical: `${SITE}/tools/analysis-geometry.html`,
    });
}

function renderSupportMatrix(support: SupportRow[]): string {
    const twoIn = support.filter(r => r.twoInput);
    const oneIn = support.filter(r => !r.twoInput);

    const twoHead = GEOM_KINDS.map(b => `<th colspan="3">second layer: ${b}</th>`).join('');
    const twoSub = GEOM_KINDS.flatMap(() => GEOM_KINDS.map(a => `<th class="sub">${a[0]}</th>`)).join('');
    const twoRows = twoIn.map(r => {
        const cells = GEOM_KINDS.flatMap(b => GEOM_KINDS.map(a => {
            const m = SUPPORT_MARK[r.cells[`${a}/${b}`] ?? 'error'];
            return `<td class="${m.cls}" title="first ${a}, second ${b} — ${m.title}">${m.glyph}</td>`;
        })).join('');
        return `<tr><th class="op">${escapeHtml(r.label)}</th>${cells}</tr>`;
    }).join('');

    const oneRows = oneIn.map(r => {
        const cells = GEOM_KINDS.map(a => {
            const m = SUPPORT_MARK[r.cells[a] ?? 'error'];
            return `<td class="${m.cls}" title="${a} — ${m.title}">${m.glyph}</td>`;
        }).join('');
        return `<tr><th class="op">${escapeHtml(r.label)}</th>${cells}</tr>`;
    }).join('');

    return `<section id="geometry-support">
<h2>Which geometry each operation takes</h2>
<p>Nothing in the configuration declares this: the analysis panel offers every layer the map has, and whether an operation can answer is a property of the query it runs. Every cell below is one real run — the operation given that geometry, and the answer recorded as it came back.</p>
<p class="legend">
  <span class="yes">●</span> returns features &nbsp;
  <span class="none">○</span> runs, but the answer is empty for this combination &nbsp;
  <span class="err">×</span> refuses this geometry
</p>
<h3>Two-layer operations</h3>
<p>Columns are the second layer's geometry; within each, <code>p</code> point, <code>l</code> line, <code>g</code> polygon is the <em>first</em> layer's.</p>
<div class="scroll"><table class="matrix">
<thead><tr><th></th>${twoHead}</tr><tr><th></th>${twoSub}</tr></thead>
<tbody>${twoRows}</tbody>
</table></div>
<h3>Single-layer operations</h3>
<div class="scroll"><table class="matrix">
<thead><tr><th></th>${GEOM_KINDS.map(a => `<th>${a}</th>`).join('')}</tr></thead>
<tbody>${oneRows}</tbody>
</table></div>
<p class="fields">An empty answer is usually geometry being honest rather than a limitation: a line clipped by a point keeps only the parts of the line that <em>are</em> that point, which is nothing unless the point lies exactly on it. A refusal is the operation saying the question does not apply — a cartogram sizes shapes by area, and a point has none.</p>
</section>`;
}

function exampleSection(inputs: any, ex: AnalysisExample): string {
    const inputFigure = ex.twoInput
        ? figure([{ fc: inputs.countries, cls: 'a' }, { fc: inputs.rectangle, cls: 'b' }], 'in: countries + rectangle')
        : figure([{ fc: inputs.countries, cls: 'a' }], 'in: countries');
    const outputFigure = ex.result?.features?.some((f: any) => f.geometry)
        ? figure([{ fc: inputs.countries, cls: 'ghost' }, { fc: ex.result, cls: 'out' }],
            `out: ${ex.featureCount} feature${ex.featureCount === 1 ? '' : 's'}`)
        : `<figure class="map-figure"><div class="no-geom">no geometry —<br>a table, not a layer</div><figcaption>out: ${ex.featureCount} row${ex.featureCount === 1 ? '' : 's'}</figcaption></figure>`;
    // A cartogram claims that area *is* the value, so it gets a third picture:
    // the same output drawn equal-area. In Mercator the frame's own distortion
    // is larger than the difference the cartogram was asked to show.
    const equalAreaFigure = ex.id === 'cartogram' && ex.result?.features?.some((f: any) => f.geometry)
        ? `<div class="arrow" aria-hidden="true">→</div>` + figure(
            [{ fc: ex.result, cls: 'out' }], 'equal area projection', EQUAL_AREA)
        : '';
    const projectionNote = ex.id === 'cartogram'
        ? `<p class="fields">Why the third picture: the first two are Web Mercator, which inflates area by 1/cos²(latitude) — within this frame alone that draws the United Kingdom about a third larger against France than it is. The cartogram itself is right (measured on the sphere, every country here comes out at 5485 m² per person, France 3.6% larger than the United Kingdom, exactly its population lead), but in Mercator the United Kingdom still *looks* the bigger of the two. A cartogram’s only claim is that area is the value, so the projection it is drawn in has to keep areas — which is what the equal-area version shows, and why the cartogram demo map opens in Equal Earth.</p>`
        : '';
    return `
<section id="${ex.id}">
  <h2>${escapeHtml(ex.title)}</h2>
  <p>${inline(ex.note)}</p>
  <div class="io">${inputFigure}<div class="arrow" aria-hidden="true">→</div>${outputFigure}${equalAreaFigure}</div>
  ${projectionNote}
  <p class="fields">Result attributes: ${ex.fields.map(f => `<code>${escapeHtml(f)}</code>`).join(' ')}</p>
  ${attributeTable(ex.result, ex.fields)}
</section>`;
}

function renderSingleLayerPage(inputs: any, examples: AnalysisExample[], lock: { webmapx: string }): string {
    const body = `<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a> / <a href="./geoprocessing.html">Analysis</a></div>
<h1>One-layer analysis operations</h1>
<p>The operations that take a single layer and reshape or summarise it. Same five countries throughout, so the operation is the only thing that changes — and, as on the two-layer page, every shape below is the operation's own output.</p>
</div></header>
<main>${analysisNav('analysis-single-layer.html')}
<section>
  <h2>The input</h2>
  <p>Five Natural Earth countries, each carrying a <code>name</code>, an <code>eu</code> flag (four members, one not) and a <code>pop_est</code>. The <code>eu</code> attribute is what the grouping operations below group by.</p>
  <div class="io">${figure([{ fc: inputs.countries, cls: 'a' }], 'five countries')}<div>${attributeTable(inputs.countries, ['name', 'eu', 'pop_est'])}</div></div>
</section>
${examples.map(ex => exampleSection(inputs, ex)).join('')}
<footer>Generated from webmapx <code>${lock.webmapx.slice(0, 9)}</code> by running each operation; see <a href="./geoprocessing.html">the analysis tool</a>.</footer>
</main>`;
    return page(body, {
        title: 'One-layer analysis operations',
        description: 'Dissolve, statistics, centroid, label point, buffer, convex hull, simplify, cartogram, voronoi and delaunay, each run on the same layer.',
        canonical: `${SITE}/tools/analysis-single-layer.html`,
    });
}

function renderAnalysisPage(inputs: any, examples: AnalysisExample[], lock: { webmapx: string }): string {
    const countriesFields = ['name', 'eu', 'pop_est'];
    const rectangleFields = ['name', 'note'];

    const sections = examples.map(ex => exampleSection(inputs, ex)).join('');

    const body = `<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a> / <a href="./geoprocessing.html">Analysis</a></div>
<h1>Two-layer analysis operations</h1>
<p>Every two-layer operation run on the same two layers, so the difference between them is the only thing that changes. The shapes below are the operations' own output, computed by the same code the tool runs — not illustrations of it.</p>
</div></header>
<main>${analysisNav('analysis-operations.html')}
<section>
  <h2>The two inputs</h2>
  <p>The first layer is five Natural Earth countries, each carrying a <code>name</code> and a <code>pop_est</code>. The second is one rectangle called <code>rectangle</code>, carrying a <code>name</code> and a <code>note</code>.</p>
  <p>The rectangle is placed deliberately: it <strong>contains Ireland completely</strong>, <strong>cuts the United Kingdom</strong>, and <strong>never reaches</strong> the Netherlands, Belgium or France. So every spatial test below has a visible yes <em>and</em> a visible no in one picture.</p>
  <div class="io">
    ${figure([{ fc: inputs.countries, cls: 'a' }], 'first layer: countries')}
    <div class="arrow" aria-hidden="true">+</div>
    ${figure([{ fc: inputs.countries, cls: 'ghost' }, { fc: inputs.rectangle, cls: 'b' }], 'second layer: rectangle')}
  </div>
  <div class="io">
    <div>${attributeTable(inputs.countries, countriesFields)}</div>
    <div>${attributeTable(inputs.rectangle, rectangleFields)}</div>
  </div>
  <p><strong>Both layers have a <code>name</code>.</strong> Where an operation carries both layers' attributes into one table, the second layer's colliding field is suffixed: <code>name</code> from the countries, <code>name_2</code> from the rectangle. A field that does not collide — <code>note</code> — keeps its own name.</p>
</section>
${sections}
<footer>Generated from webmapx <code>${lock.webmapx.slice(0, 9)}</code> by running each operation; see <a href="./geoprocessing.html">the analysis tool</a>.</footer>
</main>`;

    return page(body, {
        title: 'Two-layer analysis operations',
        description: 'Clip, erase, intersect, union, select by location and spatial join, each run on the same two layers, with the geometry and attributes that come out.',
        canonical: `${SITE}/tools/analysis-operations.html`,
    });
}

/**
 * Two kinds of thing live in the registry, and the index says so.
 *
 * A **tool** answers a question you asked: you open it, it takes over a panel,
 * you close it again. A **map control** is part of the map's furniture — a
 * scale bar, a north arrow, a coordinate readout — drawn on the map itself, at
 * a corner you choose, and it is simply there.
 *
 * The registry already knows which is which: `placement: 'standalone'` is a
 * control, and the distinction is not cosmetic — a control takes a `position`
 * and no toolbar entry, a tool takes a toolbar entry and no position. Nothing
 * is retyped here; the grouping is read from that field.
 *
 * `placement: 'both'` sits with the tools, because a thing that *can* live in a
 * toolbar is a tool that also happens to work on its own.
 */
function isControl(registry: any): boolean {
    return registry?.placement === 'standalone';
}



/**
 * The styling our own configs give these layers, harvested for the demos.
 *
 * webmapx does not style a calculated layer — it hands back GeoJSON, and what
 * it looks like is entirely the config author's business. That makes "how
 * should I style this?" the obvious next question, and `world.json` has already
 * answered it: day length coloured by its hours with a white halo beneath, the
 * twilight bands each their own blue. Showing that beside the unstyled data is
 * better than inventing a second opinion here, which would drift from the
 * configs people actually copy from.
 *
 * Read from disk rather than bundled: the configs are their own repository, and
 * the site is built from whichever commit `site.lock` names. Searched in both
 * places the build may find them, since the documentation is generated before
 * the site is assembled and this repo's own `config/` may not exist yet.
 */
const STYLED_FROM = ['world.json', 'demo.json', 'deeptime.json'];

function configSearchRoots(): string[] {
    const roots = [join(ROOT, 'config')];
    if (process.env.WEBMAPX_DIST_LIB) {
        roots.push(resolve(process.env.WEBMAPX_DIST_LIB, '..', 'public', 'config'));
    }
    return roots;
}

interface StyledExample { file: string; layers: any[]; sources: Record<string, any>; }

function harvestStyledLayers(): Map<string, StyledExample> {
    const found = new Map<string, StyledExample>();
    for (const root of configSearchRoots()) {
        for (const file of STYLED_FROM) {
            const path = join(root, file);
            if (!existsSync(path)) continue;
            let config: any;
            try { config = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
            const data = config.layerData ?? {};
            const topSources: Record<string, any> = {};
            const declared = Array.isArray(data.sources)
                ? data.sources
                : Object.entries(data.sources ?? {}).map(([id, source]: any) => ({ ...source, id }));
            for (const source of declared) if (source?.id) topSources[source.id] = source;

            // One generator can back more than one top-level layer in the same
            // config — deeptime.json draws `paleo-plates` as a fill layer for
            // the deforming zones *and* a line layer for the boundaries, both
            // pointing at the same source. Keeping only the first found threw
            // the second away outright: the demo showed the deforming zones
            // and never the boundaries, reported as "a line style missing"
            // when the real cause was that the line layer was never harvested.
            // So every layer in this file naming a generator is collected
            // together before deciding whether this file wins for that id.
            const byGenerator = new Map<string, { layers: any[]; sources: Record<string, any> }>();
            const layers = Array.isArray(data.layers) ? data.layers : Object.values(data.layers ?? {});
            for (const layer of layers as any[]) {
                if (!layer || typeof layer !== 'object') continue;
                // The url may sit on the layer's own sources or on one it names
                // at the top level; a self-contained layer is the common case.
                const named = typeof layer.source === 'string' && topSources[layer.source]
                    ? { [layer.source]: topSources[layer.source] }
                    : {};
                const sources = { ...named, ...(layer.sources ?? {}) };
                const match = /internalfunc:\/\/([a-z-]+)/.exec(JSON.stringify(sources));
                if (!match) continue;
                const entry = byGenerator.get(match[1]) ?? { layers: [], sources: {} };
                entry.layers.push(layer);
                Object.assign(entry.sources, sources);
                byGenerator.set(match[1], entry);
            }
            // First config wins, still — world.json is the fullest, and a
            // second opinion on the same layer is not worth a second map —
            // but "first" now means the first *file*, applied whole, not the
            // first layer inside it.
            for (const [id, entry] of byGenerator) {
                if (!found.has(id)) found.set(id, { file, layers: entry.layers, sources: entry.sources });
            }
        }
    }
    return found;
}


/** The literal `internalfunc://` url the harvested config uses, for showing beside its map. */
function styledSourceUrl(example: StyledExample): string | null {
    for (const source of Object.values(example.sources)) {
        const data = (source as any)?.data;
        if (typeof data === 'string' && data.startsWith('internalfunc://')) return data;
    }
    return null;
}

/** The same demo map, with a config's own styling in place of the plain paint. */
function styledDemoConfig(doc: any, example: StyledExample): unknown {
    const base = calculatedDemoConfig(doc) as any;
    const retarget = (value: string) => value.replace(/data=data\/paleo/, `data=${PALEO}`);
    const sources = Object.fromEntries(Object.entries(example.sources).map(([id, source]: any) => [
        id, { ...source, ...(typeof source.data === 'string' ? { data: retarget(source.data) } : {}) },
    ]));
    // Every layer the file drew from this generator, not only the first —
    // deeptime.json's plate boundaries and deforming zones are two layers
    // over one source, and a reader asking "how is this styled" wants both,
    // exactly as the real config shows them together.
    const layers = example.layers.map((layer: any, index: number) => ({
        ...layer,
        // Our configs are Dutch in places; this page is not. Only the first
        // layer carries the reader's own label — the rest keep whatever name
        // the config gave them, since deeptime.json's own titles are already
        // in English and distinguishing ("Plate boundaries" vs "Deforming
        // zones") in a way a shared label would erase.
        ...(index === 0 ? { title: `${doc.label} — styled as in ${example.file}` } : {}),
        ...(layer.sources ? { sources } : {}),
    }));
    base.layerData.layers = [base.layerData.layers[0], ...layers];
    base.layerData.sources = [
        base.layerData.sources[0],
        ...Object.entries(sources).map(([id, source]: any) => ({ ...source, id })),
    ];
    base.state.activeLayers = [
        { ref: 'osm', visible: true },
        ...layers.map((layer: any) => ({ ref: layer.id, visible: true })),
    ];
    base.project.id = `docs-calculated-${doc.id}-styled`;
    return base;
}

/**
 * The computed-layer reference.
 *
 * Read from the built library rather than written here, exactly as the tool
 * registry is: these layers are code, and a documentation page that lists them
 * from memory is a page that will one day describe a generator that no longer
 * exists. webmapx's own test keeps the catalog and the generators in step; this
 * only renders what it is given.
 */

/** Where the plate models sit, seen from a config two levels under the site root. */
const PALEO = '../../config/data/paleo';

/** The basemap every calculated-layer demo sits on, spelled as the tool demos spell it. */
const DEMO_BASEMAP = {
    id: 'osm-source',
    type: 'raster',
    service: 'xyz',
    url: ['https://tiles.edugis.nl/mapproxy/osm/tiles/osm_EPSG900913/{z}/{x}/{y}.png?origin=nw'],
    tileSize: 256,
    maxzoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
};

/**
 * A one-layer map for one calculated layer.
 *
 * The styling is deliberately generic — a fill, a line and a circle over the
 * same source — because these generators return whatever geometry their subject
 * has, and a demo that styled each one by hand would be 21 sets of paint to keep
 * in step with the code. It shows what the layer *is*; a real config styles it
 * for what it is being used to say.
 *
 * The time slider and the projection picker are here because they are what makes
 * these layers legible: most are a function of the moment, and the ones that are
 * not (a graticule, Tissot's circles, the UTM zones) exist to show what a
 * projection does — which needs a projection you can change. The legend carries
 * each layer's own description.
 */
function calculatedDemoConfig(doc: any): unknown {
    // `data=` inside an internalfunc url resolves against the config's own
    // location, and these configs sit two levels below the served config root.
    const url = doc.example.replace(/data=data\/paleo/, `data=${PALEO}`);
    const deepTime = doc.category === 'deep-time';
    const kinds: string[] = doc.geometryKinds ?? ['polygon', 'line', 'point'];
    return {
        version: 0,
        // These demos need no key — OSM tiles and arithmetic — but the loader
        // looks for the file beside the config unless told otherwise, and a 404
        // on every demo is the kind of noise that hides a real one.
        apiKeysFile: '../../config/apikeys.json',
        project: {
            id: `docs-calculated-${doc.id}`,
            title: doc.label,
            description: `Documentation demo for the calculated layer ${doc.id}.`,
            language: 'en',
        },
        map: { label: doc.label, type: 'maplibre', center: [10, 20], zoom: 1 },
        layerData: {
            sources: [
                DEMO_BASEMAP,
                { id: 'calculated-source', type: 'geojson', data: url, attribution: 'Computed in the browser' },
            ],
            layers: [
                {
                    id: 'osm', type: 'raster', title: 'OpenStreetMap', source: 'osm-source',
                    metadata: { reference: true, swatch: '#f2efe9' },
                },
                {
                    id: 'calculated', type: 'style', title: `${doc.label} (computed)`,
                    sources: { calculated: { type: 'geojson', data: url, attribution: 'Computed in the browser' } },
                    // Only the kinds this generator returns. Painting all three
                    // over one source made the info tool report every hit twice
                    // — the fill and the line both answer for the same feature —
                    // and put "Areas" in the legend of a layer that draws none.
                    layers: [
                        ...(kinds.includes('polygon') ? [{ id: 'calculated-fill', type: 'fill', source: 'calculated',
                          paint: { 'fill-color': 'rgba(43,108,143,0.35)', 'fill-outline-color': '#1b4a63' },
                          metadata: { label: 'Areas' } }] : []),
                        ...(kinds.includes('line') || kinds.includes('polygon') ? [{ id: 'calculated-line', type: 'line', source: 'calculated',
                          paint: { 'line-color': '#1b4a63', 'line-width': 1.5 },
                          metadata: { label: 'Lines' } }] : []),
                        // A circle layer with no filter draws at every vertex of
                        // *any* geometry sharing this source, not only at real
                        // Point features — confirmed against a bare MapLibre
                        // instance: a circle layer over LineString-only data
                        // drew a dot at each coordinate with no filter needed to
                        // trigger it. Only layers that mix kinds in one source
                        // (equilibrium-tide: lines plus two bulge points) ever
                        // showed it; every single-kind layer was accidentally
                        // safe. The rest of webmapx already filters every
                        // general-purpose circle layer this way (dropped file
                        // import, WMS/MVT discovery, search results) — this was
                        // the one place that didn't.
                        ...(kinds.includes('point') ? [{ id: 'calculated-circle', type: 'circle', source: 'calculated',
                          filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
                          paint: { 'circle-color': '#d9633c', 'circle-radius': 5, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 },
                          metadata: { label: 'Points' } }] : []),
                    ],
                    metadata: { abstract: doc.summary, title: `${doc.label} (computed)` },
                },
            ],
        },
        state: { activeLayers: [{ ref: 'osm', visible: true }, { ref: 'calculated', visible: true }] },
        tools: {
            // `{ma}` in a deep-time url is filled in by the deep-time tool, which
            // owns that clock — the time slider runs in dates and cannot answer
            // in millions of years. Without it the source waits on a value that
            // never arrives and the layer stays empty, which is exactly how these
            // two demos first came out blank.
            ...(deepTime ? {
                deeptime: {
                    type: 'deeptime', enabled: true, data: `${PALEO}/merdith2021`, to: 1000,
                    models: [
                        { id: 'merdith2021', label: 'Merdith 2021 — 1000 Ma', data: `${PALEO}/merdith2021`, to: 1000 },
                        { id: 'muller2019', label: 'Müller 2019 — 250 Ma', data: `${PALEO}/muller2019`, to: 250, plates: `${PALEO}/muller2019/plates` },
                    ],
                },
            } : { timeSlider: { type: 'timeSlider', enabled: true } }),
            projection: { type: 'projection', enabled: true },
            // Not decoration: every generator computes numbers the geometry
            // cannot show. `day-length`'s five lines are parallels and nothing
            // on screen says which is eight hours and which is sixteen; a
            // graticule line does not say its longitude, a UTM zone does not
            // say its EPSG code, and a great circle does not say it is 9285 km.
            // Clicking is how a reader gets at any of it.
            info: { type: 'info', enabled: true },
            layerOverview: { type: 'layerOverview', enabled: true },
            mainToolbar: {
                type: 'toolbar', enabled: true, position: 'top-left', orientation: 'vertical',
                items: [
                    deepTime
                        ? { type: 'deeptime', id: 'deeptime', enabled: true }
                        : { type: 'timeSlider', id: 'timeSlider', enabled: true },
                    { type: 'projection', id: 'projection', enabled: true },
                    { type: 'info', id: 'info', enabled: true },
                    { type: 'layerOverview', id: 'layerOverview', enabled: true },
                ],
            },
            navigation: { type: 'navigation', enabled: true, position: 'top-right' },
            // The globe projection puts the map behind the time tool's panel
            // at some widths, and fullscreen is the way out of that — placed
            // right under navigation so it reads as part of the same cluster.
            fullscreen: { type: 'fullscreen', enabled: true, position: 'top-right' },
            attribution: { type: 'attribution', enabled: true, position: 'edge-bottom-right' },
        },
    };
}

/**
 * One demo page for all of them, picked with `?layer=`.
 *
 * Twenty-one pages would each be the same map with one url changed, and every
 * one of them another page to keep in step. The picker doubles as the way to
 * compare two layers: choosing another reloads only the frame.
 */
function renderCalculatedDemoPage(docs: any[], styled: Map<string, StyledExample>): string {
    const options = docs.map((doc: any) =>
        `<option value="${escapeHtml(doc.id)}">${escapeHtml(doc.label)} — ${escapeHtml(doc.id)}</option>`).join('');
    const meta = JSON.stringify(Object.fromEntries(docs.map((doc: any) => {
        const example = styled.get(doc.id);
        return [doc.id, {
            label: doc.label,
            summary: doc.summary,
            example: doc.example,
            styledIn: example?.file ?? null,
            styledUrl: example ? styledSourceUrl(example) : null,
            paint: example ? JSON.stringify(example.layers.length === 1 ? example.layers[0] : example.layers, null, 2) : null,
        }];
    })));

    const body = `<style>
figure{margin:0}
figure.demo-map{margin-top:1rem}
figure.demo-map .mapwrap{margin:0}
figure.demo-map figcaption{font-size:.85rem;color:#5b6b78;margin-top:.4rem}
figure.demo-map figcaption strong{color:#1a1a1a}
details.paint{margin-top:1rem}
details.paint summary{cursor:pointer;font-size:.9rem;color:#0070f3}
</style>
<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a> / <a href="./calculated-layers.html">Calculated layers</a></div>
<h1 id="demo-title">Calculated layer</h1>
<p id="demo-summary"></p>
</div></header>
<main>
<section>
  <p><label for="layer-picker">Layer</label> <select id="layer-picker">${options}</select></p>
  <figure class="demo-map">
    <div class="mapwrap"><iframe id="plain-frame" allow="fullscreen" title="The layer with no styling"></iframe></div>
    <figcaption><strong>The data as it arrives.</strong> One fill, one line, one circle — enough to see the shapes and click them, and nothing more.</figcaption>
  </figure>
  <p class="fields">Source url: <code id="demo-url"></code></p>
  <p class="fields">Click a shape with the <strong>info</strong> tool to read what was computed for it — the hours of daylight on a day-length line, the EPSG code of a UTM zone, the distance along a great circle. That is where these layers keep their answer; the shape only says where it applies.</p>
</section>
<section id="styling-section" hidden>
  <h2>Styling</h2>
  <p class="fields"><strong>WebMapX does not style these layers.</strong> A generator returns GeoJSON carrying the attributes listed in the <a href="./calculated-layers.html">reference</a>; every colour, width and rule after that is written by whoever writes the config. The map below is what one of our own configs chose to do with it — worth copying, and worth disagreeing with.</p>
  <figure class="demo-map">
    <div class="mapwrap"><iframe id="styled-frame" allow="fullscreen" title="The layer styled as a suggestion"></iframe></div>
    <figcaption><strong>One way to style it</strong>, taken from <code id="styled-source"></code>. A suggestion, not a default.</figcaption>
  </figure>
  <p class="fields" id="styled-url-line" hidden>That config's own source url: <code id="styled-url"></code><span id="styled-url-note"></span></p>
  <details class="paint" id="paint-details">
    <summary>The layer definition behind that styling</summary>
    <pre><code id="paint-json"></code></pre>
  </details>
</section>
<script>
const META = ${meta};
const picker = document.getElementById('layer-picker');
const initial = new URLSearchParams(location.search).get('layer');
if (initial && META[initial]) picker.value = initial;
function frameFor(name) {
    // Relative to preview.html, which is what resolves it — not to this page.
    return '../testpages/preview.html?storageKey=webmapx-docs-no-override&config=../tools/calculated/' + name + '.json';
}

/**
 * Frames every demo on wherever its data actually is, rather than a fixed
 * centre. Several of these layers move daily — the sublunar point, the
 * subsolar point, an equinox-dependent band — and a fixed [10, 20] zoom 1
 * regularly put the one feature drawn clean off the edge of the map, which
 * looked like the layer had failed to render at all.
 */
function fitFrameToData(frame) {
    const win = frame.contentWindow;
    if (!win) return;
    let tries = 0;
    const attempt = () => {
        tries++;
        try {
            const map = win.document.querySelector('webmapx-map');
            const adapter = map && map.adapter;
            const style = adapter && (adapter.core?.mapInstance ?? adapter.map)?.getStyle?.();
            if (!adapter || !style) { if (tries < 40) setTimeout(attempt, 250); return; }
            let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity, seen = false;
            const visit = (coords) => {
                if (typeof coords[0] === 'number') {
                    const [lon, lat] = coords;
                    west = Math.min(west, lon); east = Math.max(east, lon);
                    south = Math.min(south, lat); north = Math.max(north, lat);
                    seen = true;
                    return;
                }
                for (const c of coords) visit(c);
            };
            for (const sid of Object.keys(style.sources)) {
                if (!sid.includes('calculated')) continue;
                const data = adapter.getSourceData && adapter.getSourceData(sid);
                if (typeof data !== 'object' || !data) continue;
                for (const f of data.features || []) if (f.geometry) visit(f.geometry.coordinates);
            }
            if (!seen) { if (tries < 40) setTimeout(attempt, 250); return; }
            // A single point, or a tight cluster, needs padding — fitBounds on a
            // zero-size box zooms to street level, hiding the very thing it is
            // meant to show. A pad floor keeps a point-layer's context visible.
            const padLon = Math.max((east - west) * 0.2, 15);
            const padLat = Math.max((north - south) * 0.2, 10);
            adapter.fitBounds([
                Math.max(west - padLon, -180), Math.max(south - padLat, -85),
                Math.min(east + padLon, 180), Math.min(north + padLat, 85),
            ]);
        } catch (e) { /* frame not ready yet, or a cross-origin hiccup — try again */ if (tries < 40) setTimeout(attempt, 250); }
    };
    frame.addEventListener('load', () => setTimeout(attempt, 500));
}
fitFrameToData(document.getElementById('plain-frame'));
fitFrameToData(document.getElementById('styled-frame'));
function show(id) {
    const doc = META[id];
    document.getElementById('demo-title').textContent = doc.label;
    document.getElementById('demo-summary').textContent = doc.summary;
    document.getElementById('demo-url').textContent = doc.example;
    document.getElementById('plain-frame').src = frameFor(encodeURIComponent(id));

    const section = document.getElementById('styling-section');
    if (doc.styledIn) {
        document.getElementById('styled-source').textContent = doc.styledIn;
        document.getElementById('styled-frame').src = frameFor(encodeURIComponent(id) + '-styled');
        document.getElementById('paint-json').textContent = doc.paint;
        const urlLine = document.getElementById('styled-url-line');
        if (doc.styledUrl) {
            document.getElementById('styled-url').textContent = doc.styledUrl;
            document.getElementById('styled-url-note').textContent =
                doc.styledUrl === doc.example ? '' : ' — not the reference url above, so the map may cover a different span or count.';
            urlLine.hidden = false;
        } else {
            urlLine.hidden = true;
        }
        section.hidden = false;
    } else {
        section.hidden = true;
        document.getElementById('styled-frame').removeAttribute('src');
    }
    const url = new URL(location.href);
    url.searchParams.set('layer', id);
    history.replaceState(null, '', url);
}
picker.addEventListener('change', () => show(picker.value));
show(picker.value);
</script>
</main>`;
    return page(body, {
        title: 'Calculated layer demo',
        description: 'A live map for each layer WebMapX computes in the browser, unstyled beside one way of styling it.',
        canonical: `${SITE}/tools/calculated-layer.html`,
    });
}

function renderCalculatedLayers(docs: any[], categories: any[], lock: { webmapx: string }): string {
    const entry = (doc: any) => {
        const params = doc.params.length
            ? `<table class="attrs"><thead><tr><th>Parameter</th><th>What it does</th></tr></thead><tbody>${doc.params.map((p: any) =>
                `<tr><td><code>${escapeHtml(p.name)}</code></td><td>${inline(p.summary)}${
                    p.fallback ? ` <span class="muted">Left out: ${inline(p.fallback)}.</span>` : ''
                }</td></tr>`).join('')}</tbody></table>`
            : '<p class="fields">No parameters.</p>';
        const attributes = (doc.attributes ?? []).length
            ? `<table class="attrs"><thead><tr><th>Attribute</th><th>What it holds</th><th>Unit</th></tr></thead><tbody>${
                doc.attributes.map((a: any) => `<tr><td><code>${escapeHtml(a.name)}</code></td><td>${inline(a.summary)}</td><td>${
                    a.unit ? `<code>${escapeHtml(a.unit)}</code>` : ''}</td></tr>`).join('')}</tbody></table>`
            : '';
        return `<section class="layer" id="${escapeHtml(doc.id)}">
  <h3>${escapeHtml(doc.label)} <code>${escapeHtml(doc.id)}</code></h3>
  <p>${inline(doc.summary)}</p>
  <p class="fields">${escapeHtml(doc.geometry)}. ${doc.clock === 'always'
      ? 'Redrawn whenever the map’s clock moves.'
      : 'The same picture whatever the moment.'}</p>
  ${params}
  ${attributes ? `<p class="fields">Every feature carries:</p>${attributes}` : ''}
  <pre>${escapeHtml(doc.example)}</pre>
  <p class="fields"><a href="./calculated-layer.html?layer=${encodeURIComponent(doc.id)}">Open the demo &rarr;</a></p>
</section>`;
    };

    const groups = categories
        .filter((category: any) => docs.some((doc: any) => doc.category === category.id))
        .map((category: any) => `<section class="group">
  <h2>${escapeHtml(category.label)}</h2>
  <p class="group-blurb">${inline(category.blurb)}</p>
  ${docs.filter((doc: any) => doc.category === category.id).map(entry).join('')}
</section>`).join('');

    const body = `<style>
/* A group is a divider, not a bigger layer. Small, spaced, ruled and muted
   reads as "everything under here is Sun"; a heading in the same voice as the
   layers had readers taking "Sun" for a layer next to "Sun position". */
.group > h2{font-size:.78rem;text-transform:uppercase;letter-spacing:.14em;color:#5b6b78;
  border-bottom:2px solid #d7dee4;padding-bottom:.4rem;margin-bottom:.35rem}
.group{margin-top:3.5rem}
.group-blurb{color:#667783;font-size:.92rem;margin-bottom:.4rem}
/* Each layer hangs off that rule, so the nesting is visible without reading. */
.layer{margin-top:1.8rem;padding-left:1rem;border-left:3px solid #e2e8ec}
.layer > h3{font-size:1.12rem;font-weight:700;letter-spacing:-.01em}
.layer > h3 code{font-weight:400;font-size:.8em;color:#5b6b78}
</style>
<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a> / <a href="./index.html">Tools</a></div>
<h1>Calculated layers</h1>
<p>Layers whose data is worked out in the browser instead of fetched. A source url of <code>internalfunc://day-night</code> means “ask the code for it”: some data is a function of the moment rather than a document on a server, and fetching it would make it stale on arrival, unavailable offline, and a request for something a browser computes in a millisecond. The protocol is deliberately not <code>http</code>, so a reader of a config can see at a glance that nothing is downloaded.</p>
</div></header>
<main>
<section>
  <h2>Using one</h2>
  <p>Name it as a source’s <code>data</code>, and style the layer as you would any GeoJSON. Parameters ride along as a query string.</p>
  <pre>"sources": {
  "daylight": { "type": "geojson", "data": "internalfunc://day-night?refresh=auto" }
}</pre>
  <p><code>refresh=auto</code> asks the layer to keep itself current as the wall clock runs — worth it for the ones that move visibly, wasted on the ones that are the same picture all year. Every computed layer is recomputed when the map’s clock <em>jumps</em>, refreshing or not. A url that pins its own moment with <code>?at=</code> stops following the clock at all, which is how a story shows one instant while the rest of the map moves.</p>
  <p>${docs.length} layers, listed as the build that made this page has them.</p>
</section>
${groups}
<footer>Generated from webmapx <code>${lock.webmapx.slice(0, 9)}</code>; the list comes from the build, not from this page.</footer>
</main>`;
    return page(body, {
        title: 'Calculated layers',
        description: 'Every internalfunc:// layer WebMapX computes in the browser — sun, moon, tides, graticules, projection distortion, deep time — with its parameters.',
        canonical: `${SITE}/tools/calculated-layers.html`,
    });
}

function renderIndex(docs: ToolDoc[], byId: Map<string, any>, undocumented: any[], calculated: any[]): string {
    const card = (doc: ToolDoc) => {
        const registry = byId.get(doc.id);
        return `<tr><td><a class="tool-link" href="./${doc.id}.html">${toolIconSvg(registry.icon)}${escapeHtml(registry.label)}</a><br><code>${doc.id}</code></td><td>${inline(doc.tagline)}</td></tr>`;
    };

    const section = (title: string, blurb: string, rows: ToolDoc[], pending: any[]) => {
        if (!rows.length && !pending.length) return '';
        const table = rows.length ? `<table><tbody>${rows.map(card).join('')}</tbody></table>` : '';
        const rest = pending.length
            ? `<p class="pending">Not documented yet: ${pending.map(t => `<code>${t.id}</code>`).join(', ')}</p>`
            : '';
        return `<section><h2>${escapeHtml(title)}</h2><p>${inline(blurb)}</p>${table}${rest}</section>`;
    };

    const tools = docs.filter(d => !isControl(byId.get(d.id)));
    const controls = docs.filter(d => isControl(byId.get(d.id)));
    const toolsPending = undocumented.filter(t => !isControl(t));
    const controlsPending = undocumented.filter(isControl);

    const body = `<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a></div>
<h1>Tools, controls and calculated layers</h1>
<p>Everything WebMapX ships, one page each: a live map, what it does, how to use it, how to put it in your own map, and where its code lives.</p>
</div></header>
<main>${section(
    'Tools',
    'Opened from a toolbar, and answered in a panel. A tool is something you go to when you have a question — measure this, tell me about that, draw here — and close again when you are done. Each one is a `tools` entry naming its `type`, plus an item in a toolbar.',
    tools, toolsPending)}${section(
    'Map controls',
    'Drawn on the map itself rather than in a panel. A control is furniture: a scale bar, a coordinate readout, a north arrow — it takes a `position` such as `bottom-left` instead of a toolbar entry, and it is simply present rather than opened. The toolbar that holds the tools is positioned on the map the same way, though it is a container rather than a tool in its own right.',
    controls, controlsPending)}
${calculated.length ? `<section><h2>Calculated layers</h2>
<p>Data worked out in the browser rather than fetched — where night falls, where the moon stands, what a projection does to a circle, where the coastlines were 200 million years ago. A source names one with an <code>internalfunc://</code> url instead of an address, which is also how a reader of a config can tell at a glance that nothing is downloaded.</p>
<p><a class="tool-link" href="./calculated-layers.html">All ${calculated.length} calculated layers →</a></p></section>` : ''}
<footer>Machine-readable: <a href="./index.json">index.json</a>, <a href="../llms.txt">llms.txt</a>.</footer></main>`;
    return page(body, {
        title: 'WebMapX tools, controls and calculated layers',
        description: 'Every WebMapX map tool, map control and calculated layer, with a live demo and documentation for each.',
        canonical: `${SITE}/tools/`,
        alternate: './index.json',
    });
}

// ── main ────────────────────────────────────────────────────────────────────

// The registry comes from the built library, not from a copy kept here.
// WEBMAPX_DIST_LIB points at a webmapx checkout's dist-lib in CI, where this
// repo has none of its own.
const distLib = process.env.WEBMAPX_DIST_LIB
    ? resolve(process.env.WEBMAPX_DIST_LIB, 'webmapx-config.js')
    : join(ROOT, 'dist-lib', 'webmapx-config.js');
if (!existsSync(distLib)) {
    console.error(`no built webmapx-config.js at ${distLib} — set WEBMAPX_DIST_LIB or copy dist-lib/ here`);
    process.exit(1);
}
const { TOOL_REGISTRY, INTERNAL_SOURCE_DOCS, INTERNAL_SOURCE_CATEGORIES } = await import(pathToFileURL(distLib).href) as any;
const byId = new Map<string, any>(TOOL_REGISTRY.map((t: any) => [t.id, t]));

const lock = readLock();
const docs = loadDocs();
const check = process.argv.includes('--check');

const unknown = docs.filter(d => !byId.has(d.id));
if (unknown.length) {
    console.error(`docs for tools not in the registry: ${unknown.map(d => d.id).join(', ')}`);
    process.exit(1);
}

const documented = new Set(docs.map(d => d.id));
const undocumented = TOOL_REGISTRY.filter((t: any) => t.offered !== false && !documented.has(t.id));

mkdirSync(OUT_DIR, { recursive: true });

for (const doc of docs) {
    const registry = byId.get(doc.id);
    writeFileSync(join(OUT_DIR, `${doc.id}.html`), renderTool(doc, registry, lock));
    writeFileSync(join(OUT_DIR, `${doc.id}.json`), JSON.stringify({
        id: doc.id,
        label: registry.label,
        tagline: doc.tagline,
        status: doc.status,
        element: registry.tag,
        placement: registry.placement,
        configType: doc.id,
        demoConfig: doc.config ?? null,
        configFragment: doc.config ? configFragment(doc.config, doc.id) : null,
        source: doc.source,
        tests: doc.tests,
        related: doc.related,
        sections: doc.sections,
        page: `${SITE}/tools/${doc.id}.html`,
        webmapxCommit: lock.webmapx,
    }, null, 2) + '\n');
}

// The analysis worked example, when its data has been generated. Optional, so
// a docs build without a webmapx checkout still produces the rest of the site.
const analysisInputs = join(ROOT, 'docs', 'data', 'analysis-inputs.json');
const analysisResults = join(ROOT, 'docs', 'data', 'analysis-results.json');
if (existsSync(analysisInputs) && existsSync(analysisResults)) {
    const inputs = JSON.parse(readFileSync(analysisInputs, 'utf8'));
    const { results, support } = JSON.parse(readFileSync(analysisResults, 'utf8'));
    const twoLayer = results.filter((r: AnalysisExample) => r.twoInput);
    const oneLayer = results.filter((r: AnalysisExample) => !r.twoInput);
    writeFileSync(join(OUT_DIR, 'analysis-operations.html'), renderAnalysisPage(inputs, twoLayer, lock));
    writeFileSync(join(OUT_DIR, 'analysis-single-layer.html'), renderSingleLayerPage(inputs, oneLayer, lock));
    if (support?.length) {
        writeFileSync(join(OUT_DIR, 'analysis-geometry.html'), renderGeometryPage(support, lock));
    }
    console.log(`analysis pages: ${twoLayer.length} two-layer, ${oneLayer.length} one-layer, ${support?.length ?? 0} in the geometry matrix`);
} else {
    console.log('analysis example: skipped (run `npm run build:analysis-examples` in the webmapx checkout)');
}

// The catalog arrived in webmapx after this page was written, and the site is
// built from whichever commit `site.lock` names — so a build against an older
// one leaves the page out rather than failing, and the index says nothing about
// layers that version cannot draw.
const calculated: any[] = Array.isArray(INTERNAL_SOURCE_DOCS) ? INTERNAL_SOURCE_DOCS : [];
if (calculated.length) {
    writeFileSync(join(OUT_DIR, 'calculated-layers.html'), renderCalculatedLayers(calculated, INTERNAL_SOURCE_CATEGORIES ?? [], lock));
    const styledExamples = harvestStyledLayers();
    console.log(`calculated layers: ${calculated.length}, ${styledExamples.size} with styling harvested from our configs`);
    writeFileSync(join(OUT_DIR, 'calculated-layer.html'), renderCalculatedDemoPage(calculated, styledExamples));
    // A config each, because the preview host takes a url rather than a config:
    // one page with a picker, twenty-one small files behind it.
    mkdirSync(join(OUT_DIR, 'calculated'), { recursive: true });
    for (const doc of calculated) {
        writeFileSync(join(OUT_DIR, 'calculated', `${doc.id}.json`), JSON.stringify(calculatedDemoConfig(doc), null, 2));
        const example = styledExamples.get(doc.id);
        if (example) {
            writeFileSync(join(OUT_DIR, 'calculated', `${doc.id}-styled.json`), JSON.stringify(styledDemoConfig(doc, example), null, 2));
        }
    }
} else {
    console.warn('no INTERNAL_SOURCE_DOCS in this webmapx build — skipping the calculated-layers page');
}
writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(docs, byId, undocumented, calculated));
writeFileSync(join(OUT_DIR, 'index.json'), JSON.stringify({
    tools: docs.map(d => ({ id: d.id, label: byId.get(d.id).label, tagline: d.tagline, page: `${SITE}/tools/${d.id}.html`, json: `${SITE}/tools/${d.id}.json` })),
    undocumented: undocumented.map((t: any) => t.id),
    webmapxCommit: lock.webmapx,
}, null, 2) + '\n');

writeFileSync(join(ROOT, 'llms.txt'), [
    '# WebMapX',
    '',
    '> Config-driven web map UI with adapters for MapLibre, OpenLayers, Leaflet and Cesium.',
    '> A map is a JSON config; every tool below is one entry in its `tools` section.',
    '',
    '## Tools',
    ...docs.map(d => `- [${byId.get(d.id).label}](${SITE}/tools/${d.id}.html): ${d.tagline} JSON: ${SITE}/tools/${d.id}.json`),
    '',
    '## Index',
    `- [All tools](${SITE}/tools/index.json)`,
    '',
].join('\n'));

console.log(`tools documented: ${docs.length}`);
if (undocumented.length) console.log(`no page yet: ${undocumented.map((t: any) => t.id).join(', ')}`);
if (check && undocumented.length) {
    console.error('--check: every registry tool needs a page in docs/tools/');
    process.exit(1);
}
