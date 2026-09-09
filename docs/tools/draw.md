---
config: config/docs/tools/draw.json
tagline: Adds points, lines and areas to the map, with your own fields.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-draw-tool.ts
  - src/components/webmapx-draw-layer-dialog.ts
tests:
  - tests/tool-registration.test.ts
related: [measure, info, layerOverview]
---

## what

Draw is for adding your own map data: mark a site, trace a route, or outline a
study area. What you draw becomes a normal layer. It appears in the legend, can
be styled, and can be saved and opened again later.

You draw **into a layer**. Before the first point, choose the layer name, the
geometry type, a color, and the fields for its features. With fields, the
drawing is data: it can be measured, filtered, joined, and exported.

One layer holds one geometry type: Point, LineString, or Polygon. Keep routes,
sites, and areas in separate layers when they need different styles or fields.

There are three kinds of attributes:

- **You type them**: `string` and `number`.
- **They come from the geometry**: `longitude`, `latitude`, `area`,
  `perimeter`, `length`. These update when you edit the feature.
- **They come from the edit**: `create-time` and `update-time`.

Two more types, `linkURL` and `imageURL`, are recognized wherever features are
shown, so a drawn point can carry a photo or a link to its source.

Which types you can pick depends on the geometry. A point has no area and a line
has no perimeter, so those are not offered.

**Snapping** is on by default. When the cursor is close to a point or edge you
already drew, it jumps there and shows a marker. Use snapping when two shapes
should share the same border. Hold **Alt** to skip snapping for one point, or
use the toggle to switch snapping off.

**Undo and redo** work while drawing and after. In an unfinished shape, undo
removes the last point. After a shape is finished, undo opens it again so you
can keep editing its points.

## use

1. Open Draw and create a layer: give it a name, a geometry type, and a color,
   and add the fields you want.
2. Draw. Click to place points. For a line or polygon, click each corner and
   then finish the shape.
3. Select a feature to fill in its attributes, move its points, or delete it.
   Select a single point and press **Delete** or **Backspace** to remove it.
4. Make more layers when you need them. Routes and sites belong in separate
   layers.
5. Save when you are done. There are two different saves, see below.

Useful keys while drawing:

- **Ctrl/Cmd+Z**, **Ctrl/Cmd+Y**: undo and redo. Point by point inside an
  unfinished shape, feature by feature outside one.
- **Alt** (held): skip snapping for the point you are about to place.
- **Delete** / **Backspace**: remove the selected point.

Every feature gets an `id` and a `name` unless you remove them.

**Saving.** There are two ways to save:

- **Export GeoJSON**, in the draw tool. This writes the shapes and attributes.
  One layer gives one `.geojson`. With several layers you choose between one
  combined file, where every feature gets a `_layer` property saying where it
  came from, or a `.zip` with one file per layer. No styling is included: this
  is the data.
- **Save layers…**, in the legend, writes what a map needs to look the same
  again: `<name>.geojson` together with `<name>_style.json`. Drop those on a map
  and the shapes come back with their colors.

Both are ordinary downloads. Nothing is uploaded, and nothing leaves your
browser.

## embed

Add `draw` to a toolbar and you are done. The tool brings its own dialog for
creating layers and needs nothing from the config.

A drawn layer is a normal GeoJSON layer from the moment the layer exists, so the
rest of the map already understands it: the legend lists it, the info tool reads
its attributes, and measure and the analysis tools accept it as input.

## extend

Draw can also write **into an existing layer**. Use `borrowedSourceId` on the
layer configuration, and `allowedAttributes` to limit which fields people may
add. Use this when the map already has a dataset and new features must use its
columns.

Computed fields are recalculated from the geometry. Adding a new computed field
means adding the calculation too, not only adding another option to the list.

Snapping is `findSnap` in `src/utils/snap-utils.ts`, shared rather than private
to this tool. Two numbers control it: a 16px threshold, and an 8px penalty an
edge must beat before it wins over a corner point. Candidates are the features of
the draw layers, minus the one being edited, and minus other points while you
place a point, since snapping a point onto a point is rarely what anyone wants.
`findSnap` first filters by a geographic box around the cursor, before
projecting anything. That keeps snapping fast on a layer with many vertices,
where `project()` is the expensive part.
