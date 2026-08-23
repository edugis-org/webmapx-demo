# Notes / open issues

## Local tooling

The site is plain static files; npm is only used for the local dev server and
the preview-image generator. Neither runs in CI.

```
npm install                     # tsx, typescript, playwright
npx playwright install chromium # once per machine, ~115 MB, only for previews
```

```
npm start                       # serve repo root at http://127.0.0.1:8080 (PORT=… to change)
npm run updateMapPreviews       # rewrite previews/<id>.jpg from the live demos
npm run updateMapPreviews -- volcano   # only ids containing "volcano"
npm run typecheck
```

`previews/*.jpg` are screenshots of each demo, shown by `index.html` while the
real (iframed) map boots. They are **committed** and copied to `dist/` by the
workflow — regenerate and commit them by hand after changing a demo config,
otherwise the placeholder shows the old map.

The demo list lives in `demos.js`, imported by both `index.html` (browser) and
`scripts/update-map-previews.ts` (node). Add a demo there, then regenerate.

## Site config is a stale fork of the webmapx default config

**Symptom:** tools added to webmapx's default config never show up on
https://webmapx.com/demo/ after a redeploy. Concretely: the stories tool and its
demo story are configured in webmapx (`public/config/demo.json`, `tools[] ->
{"type": "stories"}` plus a top-level `stories` section) but the deployed demo
shows no stories tool.

**Cause:** `.github/workflows/pages.yml` clones and builds webmapx, but only
takes the *lib*, *testpages* and *data* output from it:

```
cp -R /tmp/webmapx/dist-lib/. dist/dist-lib/
cp -R /tmp/webmapx/dist/testpages/. dist/testpages/
cp -R /tmp/webmapx/dist/data/. dist/demo/data/
cp -R config/. dist/config/        # <-- THIS repo's own config dir
```

`demo/index.html` loads `../config/demo.json`, i.e. `config/demo.json` from this
repo — a hand-made copy that has drifted from webmapx's `public/config/demo.json`
(79118 vs 82073 bytes at the time of writing). Upstream config changes are
therefore never deployed.

The tool code itself is not the problem: `src/bootstrap/tool-loader.ts` lazy-imports
every tool type, so the `dist-lib` build already contains the stories tool.

## Goal

The final webmapx.com should demo **all** tools, including their example data, and
should follow the upstream default config automatically instead of via manual copies.

## Fix (applied 2026-08-24)

Let upstream own `demo.json`, and let this repo keep only the configs it adds
(`belgie.json`, `demo-mlgl-globe.json`, ... ). In the "Assemble site" step:

```
cp -R config/. dist/config/                          # demo-repo-specific configs first
cp /tmp/webmapx/dist/config/demo.json dist/config/   # upstream default config wins
cp -R /tmp/webmapx/dist/config/stories-demo dist/config/
```

`config/demo.json` is `git rm`-ed in the same commit and added to `.gitignore`, so no
stale duplicate can be edited by mistake. webmapx's `public/config/demo.json` stays the
single source of truth — and it must be **committed and pushed**, since CI clones it
from GitHub rather than from a local checkout.

For local `npm start`, keep an untracked copy:

```
cp ../webmapx/public/config/demo.json config/demo.json
```

### Things that must keep working

- **Story assets.** Story steps reference `htmlUrl: "stories-demo/step2.html"` and
  `stories-demo/images/`, resolved relative to the config URL. Copying `demo.json`
  alone gives a broken step 2 — `stories-demo/` must be copied too. Both are tracked
  upstream (`public/config/stories-demo/`).
- **Gitignored upstream configs.** webmapx gitignores `public/config/layers.json`,
  `public/config/world.json` and `public/config/apikeys.json`, so the CI clone does
  not contain them. This repo's own `config/` copies must keep supplying those; the
  copy order above keeps the upstream override limited to `demo.json` +
  `stories-demo/`.
- **API keys.** `dist/demo/config/apikeys.json` is still written from the
  `APIKEYS_JSON` secret; unrelated to the above but part of the same assemble step.

### Follow-up to check when doing this

- Whether upstream `demo.json` references any other example data that the workflow
  does not copy (only `/tmp/webmapx/dist/data` is copied today).
- Whether upstream `demo.json` expects `layers.json`/`world.json` contents that
  differ from this repo's copies — if so, those should move somewhere fetchable
  rather than being gitignored upstream.
