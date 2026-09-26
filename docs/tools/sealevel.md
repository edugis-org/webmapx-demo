---
config: config/docs/tools/sealevel.json
tagline: Moves the sea level from the last ice age to a world without land ice.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-sealevel-tool.ts
  - src/utils/sea-level-style.ts
  - src/utils/sea-level-curve.ts
tests:
  - tests/sea-level-style.test.ts
  - tests/sea-level-curve.test.ts
  - tests/pmtiles-config-paths.test.ts
related: [deeptime, timeSlider, compare]
---

## what

Sea level shows where the sea reaches at a chosen level, from −134 m — the
lowest sea level of the last glacial maximum, about 21,000 years ago — to
+70 m, when all land ice has melted.

Below today the dry sea floor is drawn as land: Doggerland joins Britain to the
continent, and the Bering Strait closes. Above today the sea floods the coasts.

The sea only goes where it can reach. A depression floods once the sea spills
over its lowest saddle, not at its own depth: the Black Sea connects at −28 m
over the Bosporus, the Caspian at +25 m, the Dead Sea at +58 m.

## use

1. Open the tool and move the slider, or use the step buttons and ▶ to play.
   **Today** goes back to today's level.
2. Switch to **Time** to move through years instead of metres. The level then
   follows a sea level curve (Lambeck et al. 2014), and the panel names the
   period — meltwater pulse 1A, the Younger Dryas, Doggerland drowning.

Closing the panel leaves the map at the level you chose, so you can measure,
query or print it. The legend follows the slider: "Sea", "Dry sea floor" and
"As today".

Not for navigation: coastal land heights are only indicative.

## embed

Add `sealevel` to a toolbar. Nothing else is required. The tool adds its own
layer from the coastal zones archive (`tiles`) when the map and its catalog
have none — or from the same zones as GeoJSON (`geojson`) on an engine that
cannot read the archive — and reads its curve from `data`. All three paths
are config assets, relative to the config file.

The archive is `coastal_zones.pmtiles` (~15 MB; the GeoJSON is 10 MB, 0.8 MB gzipped), built from the GEBCO_2026 grid
and published as a release of
[edugis-org/coastal_zones](https://github.com/edugis-org/coastal_zones). It is
read with HTTP range requests, so any static host serves it — but copy it to
your own host: GitHub release downloads are not readable by a browser. The data
are CC BY 4.0; credit EduGIS and GEBCO.

To style or title the layer yourself, put a `coastal-zones` layer in the
catalog; the tool then uses that one.

## extend

The layer is split once into one sublayer per `flood_level` class, each with a
constant colour, and a move rewrites only the classes that change role. A
single data-driven `fill-color` expression was re-evaluated for every feature
of every loaded tile on each move: about 335 ms per step against 32 ms now.

The tool is the same on every engine; only the data differs, and the adapter
decides which (`canDrawSource`). MapLibre reads the `pmtiles://` archive.
OpenLayers cannot, and gets the same zones as one GeoJSON file at 16′
(`geojson`), read once into the view's projection — so the animation also runs
in Equal Earth or Mollweide, where a world map shows areas truthfully.
