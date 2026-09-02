---
config: config/docs/tools/draw.json
tagline: Put your own points, lines and shapes on the map, with the attributes you decide they carry.
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

Draw makes the map writable. Mark a site, trace a route, outline a study area —
and keep it, because what you draw becomes an ordinary layer: it appears in the
legend, it can be restyled, and it can be saved and dropped back on another day.

Drawing happens **into a layer**, not onto the map in general, and the layer is
declared before the first click: a name, a geometry type, a colour, and the
attributes its features will carry. That order is deliberate. A drawing whose
features have no agreed fields is a picture; one with fields is data, and can be
measured, filtered, joined and exported.

A layer holds one geometry type — Point, LineString or Polygon — for the same
reason a table holds one kind of row. Mixed geometry has no sensible style and
no sensible schema.

Attributes come in three kinds:

- **Typed by you** — `string` and `number`, filled in as you draw.
- **Filled in by the map** — `longitude`, `latitude`, `area`, `perimeter`,
  `length`. These are computed from the geometry, so they cannot disagree with
  the shape, and they update when it is edited.
- **Kept by the tool** — `create-time` and `update-time`, stamped for you.

Two further types, `linkURL` and `imageURL`, are read as such where features are
displayed, so a drawn point can carry a photograph or a link to a source.

Which types are offered depends on the geometry: a point has no area, a line no
perimeter, and the tool does not pretend otherwise.

**Snapping** is on by default, and it is what makes adjacent shapes actually
adjacent. As the cursor comes within a few pixels of something already drawn it
jumps to it and shows a marker, so two parcels share a boundary exactly instead
of nearly — and "nearly" is what produces slivers, gaps and areas that do not
add up. It prefers a **vertex** over an **edge**: an edge has to be clearly
closer to win, because landing on the corner someone meant is almost always
right. Hold **Alt** to suspend it for one point without turning it off, and use
the toggle to turn it off altogether.

**Undo and redo** cover the drawing as well as the drawn. Mid-shape, undo takes
back the last point you placed and lets you carry on from the one before, so a
misplaced vertex does not cost the whole outline. Once a shape is finished,
undo re-opens it — the points come back and you can continue. Adding, editing
and deleting a feature are all on the same history.

## use

1. Open the draw tool and create a layer: name it, pick its geometry type and
   colour, and add the attributes you want.
2. Draw. Click to place points; click each vertex of a line or polygon and
   finish the shape to close it.
3. Select a feature to fill in its attributes, move its vertices, or delete it.
   A vertex handle can be picked and removed with **Delete** or **Backspace**.
4. Draw more layers as you need them — routes and sites belong in different
   layers, not in one.
5. Save when you are done — see below, because there are two different saves.

Keys worth knowing while drawing:

- **Ctrl/Cmd+Z**, **Ctrl/Cmd+Y** — undo and redo, point by point inside an
  unfinished shape and feature by feature outside one.
- **Alt** (held) — suspend snapping for the point you are about to place.
- **Delete** / **Backspace** — remove the selected vertex.

Every feature gets an `id` and a `name` unless you remove them, which is what
makes a drawing addressable afterwards rather than a heap of shapes.

**Saving it.** There are two routes out, and they are not the same file:

- **Export GeoJSON**, in the draw tool, writes the geometry and attributes. One
  layer gives a single `.geojson`; several layers give you the choice of one
  combined file — every feature tagged with a `_layer` property saying where it
  came from — or a `.zip` with one file per layer. No styling is included: this
  is the data.
- **Save layer(s)…**, in the legend, writes the pair a map needs to look the
  same again: `<name>.geojson` next to `<name>_style.json`. Drop that back on a
  map and the shapes return with their colours.

Both are ordinary downloads. Nothing is uploaded, and nothing leaves the
browser.

## embed

Adding `draw` to a toolbar is enough — the tool brings its own dialog for
creating layers, and needs nothing from the config.

A drawn layer is a normal GeoJSON layer from the moment it exists, so
everything else in the map already understands it: the legend lists it, the
info tool reads its attributes, measure and the analysis tools take it as
input.

## extend

The tool can also draw **into a layer the map already has**, rather than into
one it created — `borrowedSourceId` on the layer configuration is that path,
and `allowedAttributes` restricts which fields may be added to it. That is how
a map backed by a real dataset can let people add to it without letting them
invent columns.

The computed attribute types are the part to be careful with when extending:
they are recalculated from the geometry rather than stored independently, so
adding a new one means teaching the tool how to derive it — not just adding it
to a list.

Snapping is `findSnap` in `src/utils/snap-utils.ts`, and it is shared rather
than private to this tool. Two numbers govern it: a 16px threshold, and an 8px
penalty an edge must overcome before it beats a vertex. Candidates are the
features of the draw layers, minus the one being edited — and, while placing a
point, minus other points, since snapping a point onto a point is rarely what
anyone means. It pre-filters by a geographic box around the cursor before
projecting anything, which is what keeps it usable against a layer with a very
large number of vertices, where `project()` is the expensive part.
