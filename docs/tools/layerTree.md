---
config: config/docs/tools/layerTree.json
tagline: Lets readers choose layers from a grouped catalog.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-layer-tree.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, search, info]
---

## what

The catalog lists the layers a map offers. It is a tree of named entries from
the config. Tick a layer to add it to the map. Clear the tick to remove it. The
legend shows the layers you have picked.

You decide the tree. It is not generated from the layer list, because config
order is rarely the order readers need. Groups such as "Background,"
"Population," and "Historical maps" are part of the map's design.

Groups can behave in two ways, and the difference matters:

- **Ordinary groups** let any number of children be on at once. Ticking one
  changes nothing about the others.
- **Single-choice groups** (`selectionMode: "single"`) allow one child at a
  time, which is what a background belongs in: choosing a satellite basemap
  should put away the street one rather than stack them. Add `allowNone: true`
  to let the reader also choose none of them.

Large catalogs can have a search box at the top of the tree. It matches labels and
shows matching entries wherever they sit in the tree.

## use

1. Open the catalog from the toolbar.
2. Expand a group and tick a layer to add it. It appears on the map and in the
   legend at once.
3. Type in the search box to find a layer by name without opening groups.
4. Clear the tick to remove the layer again. Any changes to the layer, such as
   opacity or style, belong to the legend, not here.

A catalog entry may point at a slow or unreachable service. The entry reports
that state instead of failing silently.

## embed

The tree lives on the toolbar item, as `tree`, and each node is one of two
things: a group with `children`, or a leaf naming a layer with `layerId`.

The `layerId` of a leaf must match a layer in `layerData.layers`. That is the
whole contract. The catalog does not define layers. The catalog arranges layers.

Useful keys on a node: `label`, `children`, `layerId`, `checked` (on at start),
`selectionMode: "single"` with `selectionGroup` and `allowNone` for
mutually exclusive groups, and `stackOrder` where a group's layers must land at
a particular depth.

## extend

The tree is read from the config through `getTreeFromMapConfig`, which looks
for the `layerTree` tool item and takes its `tree`. A `tree` property set
directly on the element overrides the config, so a host app can supply a
catalog at runtime.

The component re-reads the tree on `webmapx-config-ready`, so late or replaced
configurations update the catalog.
