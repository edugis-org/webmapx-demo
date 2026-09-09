---
config: config/docs/tools/coordinates.json
tagline: Shows pointer coordinates in the chosen format.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-coordinates-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [scale, info, measure]
---

## what

A readout of the position under the pointer.

The important choice is the *format*. `4.895, 52.372`, `52°22'19"N
4°53'42"E`, and Dutch RD New metres can all describe the same place. Use the
format your readers expect.

So the format is a choice, not a constant:

- `lonlat` and `latlon`: decimal degrees, in either order.
- `geographic-en`: degrees, minutes, and seconds with English cardinals.
- `geographic-local`: the same, with the cardinal letters of the map's
  language, so a Dutch map reads `N O Z W`.
- `crs:<EPSG code>`: any projected system, for example `crs:28992` for Dutch
  RD New. The reading is converted for display. The map is not reprojected.

## use

Move the pointer. On a phone or tablet, the readout shows the center of the map.

## embed

Add `coordinates` with a `position`, and set `defaultFormat` to whichever
notation your readers use:

    "coordinates": { "type": "coordinates", "position": "bottom-left",
                     "defaultFormat": "crs:28992" }

Without `defaultFormat`, the readout starts in decimal degrees.

## extend

A `crs:` format needs a proj4 definition before it can convert. Cataloged
projections are registered already. Register other projections before using
them here.
