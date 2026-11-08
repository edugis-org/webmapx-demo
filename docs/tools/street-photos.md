---
config: config/docs/tools/street-photos.json
tagline: Shows a street-level photo of a spot on the map.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-street-photos-tool.ts
  - src/utils/panoramax.ts
  - src/utils/google-street-view.ts
tests:
  - tests/panoramax.test.ts
  - tests/google-street-view.test.ts
related: [info, layerOverview]
---

## what

Street photos answers "what does it look like there?". Click a spot and the
panel shows a photo taken at street level, looking at that spot.

The photos come from one of two services:

- **Panoramax**, the default. An open, federated collection of street photos.
  It needs no account or API key, the photos are openly licensed, and a click
  goes to an open project rather than an advertising company. Coverage depends
  on what people have uploaded, so some places have none.
- **Google Street View**, offered only when the config has a Google API key.
  Panoramax stays the default, because every Google request sends the clicked
  position to Google.

While the tool is open with Panoramax chosen, the map shows where photos exist:
lines along the photographed routes, and one dot per photo at street level. This
is a layer called "Panoramax photos". It is listed in the legend while the tool
is open, goes away when the tool closes, and is not stored in permalinks.

Google allows its coverage layer only through its own map library, so with
Google chosen there is no coverage map.

## use

1. Open Street photos from the toolbar.
2. Zoom in until the photographed routes appear. Further out than zoom level 6
   there is nothing to show, and a click does not search.
3. Click a route, or click a photo dot to see exactly that photo. A click
   anywhere else looks for the nearest photo facing that spot.
4. Use **Colour by** to color the routes by coverage, by date, or by camera.
5. Choose **Open larger picture** to enlarge it, or **Open 360 view** for a 360°
   photo, which you can turn by dragging or with the arrow keys.
6. In the enlarged view, **Open in Panoramax** or **Open in Google Street View**
   takes you to that service. **Escape** closes the enlarged view first and the
   panel only on the next press.

If the config has a Google key, **Photos from** switches between the services.

## embed

Add `street-photos` to a toolbar. Panoramax then works with no further
configuration. The older name `panoramax` is still accepted.

To offer Google Street View, give the tool a key:

```json
"tools": {
  "street-photos": { "googleApiKey": "{key-google}" }
}
```

The key needs the **Street View Static API** enabled and a billing account.
It is visible in every visitor's browser, so restrict it to that API and to your
own sites. A click first asks Google whether there is imagery, which is free;
only then are images loaded, which Google bills per image.

The info tool's old `googleApiKey` setting is ignored: Street View moved here.

Other options are `searchDistance` (metres, default 50), and `apiUrl` and
`viewerUrl`, which point the tool at one Panoramax instance instead of all of
them.

The coverage map needs vector tiles, which MapLibre and OpenLayers draw. On
Leaflet and Cesium the panel says the map cannot show coverage, and clicking
still works.

## extend

`utils/street-photo.ts` is the one photo model both services produce, so the
panel does not know which service answered. `utils/panoramax.ts` and
`utils/google-street-view.ts` are pure functions for URLs, parsing and colors.

The search uses Panoramax's `place_position`, which finds pictures looking at a
spot rather than pictures merely taken near it. How far it looks follows the
zoom: about 12 pixels on screen, between `searchDistance` and 500 m.

The 360° viewer is Pannellum. It is loaded the first time someone enlarges a
360° photo, so a visitor who never does pays nothing for it.

Panoramax's density grid is left out on purpose: it draws an area with one photo
as large as one with thousands.
