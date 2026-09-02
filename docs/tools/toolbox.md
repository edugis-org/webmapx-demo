---
config: config/docs/tools/toolbox.json
tagline: Several tools behind one button, as a row of icons.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-toolbox-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [menu, layerOverview, settings]
---

## what

A container, not a tool: it holds other tools and shows them as a scrolling row
of icons inside one panel.

Toolbars run out of room. Ten tools down the side of a map is a wall of buttons
that hides the map they operate on, and on a phone it does not fit at all. A
toolbox takes a related group — the measuring things, the drawing things — and
puts them behind one entry, so the toolbar stays short and the grouping says
something about what belongs with what.

Only one sub-tool is active at a time; the container owns that, so opening one
puts the previous one away.

## use

Open the toolbox and pick an icon. The tool takes over the panel. Pick another
and it swaps.

## embed

Give the `toolbox` entry an `items` list, exactly like a toolbar's, naming the
tools it holds.

Nesting is allowed in the config to any depth, but a toolbox **flattens** it:
everything ends up in one row, with no submenus. If you want the hierarchy to
survive, use the menu container instead.

## extend

The DOM a container builds is always flat, whatever the config nesting: every
sub-tool is a direct child, because a nested element would be out of reach of
the container's single content slot. Inactive children are hidden with `hidden`
and `inert` rather than a forced `display`, so each sub-tool keeps its own
layout — the draw tool is a flex panel and would break if the container decided
its display for it.
