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

## Publishing — 2026-08-30

`npm run publish:site-latest` is how webmapx.com is updated. It pushes
`../webmapx-configs`, then `../webmapx`, then writes and commits `site.lock`
here and pushes it — and that last push is what triggers the pages workflow.
There is no button to press afterwards, and no `gh`/token involved.

It pushes but never commits anything except `site.lock`: uncommitted work in
either sibling repository stops it with the file list, so nothing half-finished
is published by accident. All three clones must sit side by side.

`site.lock` names the commit of **both** webmapx and webmapx-configs the site is
built from. Pinning the code too is not decoration: without it a code-only
release would leave nothing to commit here, hence no push, hence no rebuild.

**Why the site froze (29 Aug – 30 Aug).** The pin used to live in webmapx as
`configs.lock`, and this repository's workflow only runs `on: push` here. Once
the configs moved out (`ab64223`), there was no reason to push this repository
any more, so webmapx.com stayed at 29 Aug 18:38 while the configs were pinned
three more times — the deep-time tool on the live site offered one plate model
instead of two, and `data/paleo/muller2019/` 404'd. The pins moved here because
a pin is a publication decision, and this is what publishes; webmapx builds, and
its own Pages deploy at edugis-org.github.io/webmapx is a preview that follows
the config repository's main branch.

## Site config was a stale fork — resolved 2026-08-29

**Was:** this repo kept its own `config/` directory, `demo/index.html` loaded
`../config/demo.json` from it, and that copy drifted from webmapx's. Tools added
upstream never appeared on the deployed site. A first fix (2026-08-24) let
upstream's `demo.json` win while this repo kept the configs it added — which
narrowed the drift to everything *except* demo.json.

**Now:** configs live in their own repository,
[edugis-org/webmapx-configs](https://github.com/edugis-org/webmapx-configs), and
this repo keeps none. All fourteen — including the ones that used to be here:
`belgie.json`, `demo-mlgl-globe.json`, `demo-mlgl-terrain.json`,
`demo-ol-chorepleth.json`, `demo-nl.json`, `config-laptop.json`,
`webmapx-config.json` — now live there, with the styles and datasets they read
beside them.

`pages.yml` runs `npm run configs:sync` inside the webmapx checkout, which takes
the commit webmapx pinned in `configs.lock`, and copies the result:

```
npm run configs:sync                        # in the webmapx checkout
cp -R /tmp/webmapx/dist/config/. dist/config/
```

So the site serves the configs webmapx tested against, not whatever the config
repository's main branch happens to be — and a config change reaches this site
by being pinned upstream, deliberately, rather than by drifting into it.
Changing a config means editing it in webmapx-configs (`npm run configs` in a
webmapx checkout puts it at `public/config`), then `npm run configs:pin`.

## Things that must keep working

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
