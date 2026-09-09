---
config: config/docs/tools/geoprocessing.json
tagline: Builds a new layer from one or two existing layers.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-geoprocessing-tool.ts
  - src/utils/geoprocessing-operations.ts
  - src/workers/geoprocessing-runner.ts
tests:
  - tests/geoprocessing.test.ts
related: [buffer, cartogram, layerOverview]
---

## what

Analysis builds a new layer from one or two existing layers.

Available: clip, erase, intersect, union, select by location, spatial join,
dissolve, centroid, convex hull, simplify, buffer, voronoi, delaunay, and
cartogram. Plus statistics, which is a dissolve without the geometry.

Pick an operation, choose the input layers, set the options, and calculate. The
result is added to the map as a new layer.

Worth knowing before you start:

- **Clip and intersect give the same shapes, but a different number of
  features.** Clip merges the second layer first, so one input feature stays one
  output feature with its own attributes. Intersect works per overlapping pair,
  so a feature that meets three others becomes three features, each carrying the
  attributes of the one it met.
- **Simplify keeps shared borders identical.** Simplifying each polygon on its
  own simplifies a shared border twice, in two different ways, and leaves gaps
  and slivers between neighbors. This operation builds a topology first, so
  both sides keep the same points.
- **Summing and averaging attributes is a setting, not a separate operation.**
  You can add sum, mean, min, max, count, and a list of values to dissolve and to
  statistics. `total` and `average` are hidden for text fields.

Everything runs inside your browser, using GDAL compiled to WebAssembly. Your
data is not uploaded anywhere.

## use

1. Choose an operation. Its inputs and settings appear below it.
2. Pick the layers, set the values, press **Calculate**.
3. The result is added as a new layer, and the panel reports how many features
   it used.

**Only loaded data is used.** A GeoJSON layer gives every feature. A tiled layer
gives only the features in view. The panel warns you on inputs where
that can change the result.

Three example pages show the operations on real data:

- **[Two-layer operations](./analysis-operations.html)**: five countries and one
  rectangle through clip, erase, intersect, union, select by location, and
  spatial join, with the shapes and the attributes that come out of each.
- **[One-layer operations](./analysis-single-layer.html)**: dissolve, statistics,
  centroid, label point, buffer, convex hull, simplify, cartogram, voronoi, and
  delaunay on the same five countries.
- **[Which geometry each operation accepts](./analysis-geometry.html)**: points,
  lines, and polygons against every operation, tested one combination at a time,
  because not every operation accepts every geometry type.

A long calculation can be **canceled**.

## embed

Add `geoprocessing` to a toolbar. It appears as **Analysis** and works on
whatever layers are on the map.

The WebAssembly is only fetched when it is needed, so a visitor who never opens
the panel never downloads it. Opening the panel starts that download in the
background while you fill in the form.

## extend

An operation is one registry entry: inputs, parameters, a diagram, and either an
SQL template or a JavaScript function.

Operations run in EPSG:3857 instead of longitude/latitude because SpatiaLite
works on a flat plane. Inputs are written into one indexed SpatiaLite database
before the query runs. Keep the index: on 144×576 polygons it took a query from
19.8 s to 1.3 s without changing the algorithm.

Union is the slow operation to watch when testing performance. On 257 countries
against 4000 regions, clip took 4 s, intersect 5 s, and union 38 s.
