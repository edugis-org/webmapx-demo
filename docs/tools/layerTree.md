---
config: config/docs/tools/layerTree.json
tagline: The layers a map offers, arranged in groups you decide, with the search that finds them.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-layer-tree.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, search, info]
---

## what

The catalog is what a map *offers*. It is a tree of named entries, authored in
the config, and ticking one adds that layer to the map; unticking takes it off
again. The legend then shows what you have picked.

The tree is yours to shape. It is not generated from the layer list, because
the order layers happen to be defined in is not the order a reader looks for
them — "Background", "Population", "Historical maps" is a decision about the
subject, and only the person making the map can make it.

Groups can behave in two ways, and the difference matters:

- **Ordinary groups** let any number of children be on at once. Ticking one
  changes nothing about the others.
- **Single-choice groups** (`selectionMode: "single"`) allow one child at a
  time, which is what a background belongs in: choosing a satellite basemap
  should put away the street one rather than stack them. Add `allowNone: true`
  to let the reader also choose none of them.

There is a search box above the tree. From a handful of entries it is noise, so
it earns its place only on a catalog with enough in it to get lost in — it
matches on the label and shows the matching entries wherever they sit in the
tree, so a layer three groups down can be reached without knowing which three.

## use

1. Open the catalog from the toolbar.
2. Expand a group and tick a layer to add it. It appears on the map and in the
   legend at once.
3. Type in the search box to find a layer by name without opening groups.
4. Untick to remove it again. Anything you changed about the layer — its
   opacity, its style — belongs to the legend, not here.

A catalog entry may point at a layer that takes a moment to answer, or at a
service that turns out to be unreachable. Entries report that themselves rather
than failing silently, so a layer that will not come is distinguishable from one
that has not come *yet*.

## embed

The tree lives on the toolbar item, as `tree`, and each node is one of two
things: a group with `children`, or a leaf naming a layer with `layerId`.

The `layerId` of a leaf must match a layer in `layerData.layers`. That is the
whole contract — the catalog does not define layers, it arranges them.

Useful keys on a node: `label`, `children`, `layerId`, `checked` (on at start),
`selectionMode: "single"` with `selectionGroup` and `allowNone` for
mutually-exclusive groups, and `stackOrder` where a group's layers must land at
a particular depth.

## extend

The tree is read from the config through `getTreeFromMapConfig`, which looks
for the `layerTree` tool item and takes its `tree`. A `tree` property set
directly on the element wins over the config, which is how a host application
can supply a catalog it built at runtime — from a CSW search, or a user's own
list — without touching the config at all.

The component re-reads the tree on `webmapx-config-ready`, so a map whose
config arrives late, or is replaced, ends up with the right catalog rather than
an empty one.
