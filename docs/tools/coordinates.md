---
config: config/docs/tools/coordinates.json
tagline: Where the pointer is, in the notation your reader actually uses.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-coordinates-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [scale, info, measure]
---

## what

A readout of the position under the pointer, updated as it moves.

The point of it is the *format*. `4.895, 52.372` is right and unreadable;
`52°22'19"N 4°53'42"E` is what a reader copies into a report; and a Dutch
surveyor wants neither, but RD New metres. All three are the same place, and
which one is correct depends entirely on who is looking.

So the format is a choice, not a constant:

- `lonlat` and `latlon` — decimal degrees, in either order. Getting that order
  wrong is the oldest mistake in the subject, which is why both are named
  rather than one being assumed.
- `geographic-en` — degrees, minutes and seconds with English cardinals.
- `geographic-local` — the same, with the cardinal letters of the map's
  language, so a Dutch map reads `N O Z W`.
- `crs:<EPSG code>` — any projected system, for example `crs:28992` for Dutch
  RD New. The reading is converted for display; the map is not reprojected.

## use

Move the pointer. On a touch screen, where there is no pointer to follow, the
readout reports the centre of the map instead.

## embed

Add `coordinates` with a `position`, and set `defaultFormat` to whichever
notation your readers use:

    "coordinates": { "type": "coordinates", "position": "bottom-left",
                     "defaultFormat": "crs:28992" }

Without it the readout starts in decimal degrees.

## extend

A `crs:` format needs its definition available to proj4 before it can convert.
The projections the catalog already knows are registered for you; a code from
outside it has to be registered first, or the readout has nothing to convert
with and says so rather than printing a wrong number.
