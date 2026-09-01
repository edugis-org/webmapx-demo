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
function toolIconSvg(name: string | undefined): string {
    if (!name) return '';
    for (const dir of ICON_DIRS) {
        const file = join(dir, `${name}.svg`);
        if (!existsSync(file)) continue;
        const svg = readFileSync(file, 'utf8')
            .replace(/<\?xml[^>]*\?>/, '')
            // Sized in em so it follows the heading it sits in, and painted with
            // currentColor so it works in both themes without a second rule.
            .replace(/\swidth="[^"]*"/, ' width="1em"')
            .replace(/\sheight="[^"]*"/, ' height="1em"')
            .trim();
        return `<span class="tool-icon" aria-hidden="true">${svg}</span>`;
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
        ? `<div class="mapwrap"><iframe loading="lazy" title="${escapeHtml(registry.label)} demo map"
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

function renderIndex(docs: ToolDoc[], byId: Map<string, any>, undocumented: any[]): string {
    const cards = docs.map(doc => {
        const registry = byId.get(doc.id);
        return `<tr><td><a class="tool-link" href="./${doc.id}.html">${toolIconSvg(registry.icon)}${escapeHtml(registry.label)}</a><br><code>${doc.id}</code></td><td>${inline(doc.tagline)}</td></tr>`;
    }).join('');
    const missing = undocumented.length
        ? `<section><h2>Not documented yet</h2><p>${undocumented.map(t => `<code>${t.id}</code>`).join(', ')}</p></section>`
        : '';
    const body = `<header><div class="inner">
<div class="crumb"><a href="../index.html">WebMapX</a></div>
<h1>Tools</h1>
<p>Every tool WebMapX ships, one page each: a live map, what it does, how to use it, how to put it in your own map, and where its code lives.</p>
</div></header>
<main><section><table><tbody>${cards}</tbody></table></section>${missing}
<footer>Machine-readable: <a href="./index.json">index.json</a>, <a href="../llms.txt">llms.txt</a>.</footer></main>`;
    return page(body, {
        title: 'WebMapX tools',
        description: 'Every WebMapX map tool, with a live demo and documentation for each.',
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
const { TOOL_REGISTRY } = await import(pathToFileURL(distLib).href) as any;
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

writeFileSync(join(OUT_DIR, 'index.html'), renderIndex(docs, byId, undocumented));
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
