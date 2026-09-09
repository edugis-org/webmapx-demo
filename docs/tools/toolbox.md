---
config: config/docs/tools/toolbox.json
tagline: Puts several tools behind one icon row.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-toolbox-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [menu, layerOverview, settings]
---

## what

Toolbox is a container for other tools. It shows them as a scrolling row of
icons inside one panel.

Toolbars run out of room. A toolbox puts a related group, such as measuring or
drawing tools, behind one toolbar entry.

Only one child tool is active at a time.

## use

Open the toolbox and pick an icon. The selected tool takes over the panel. Pick
another icon and the panel switches to that tool.

## embed

Give the `toolbox` entry an `items` list, exactly like a toolbar's, naming the
tools it holds.

Nesting is allowed in the config to any depth, but a toolbox **flattens** it:
everything ends up in one row, with no submenus. If you want the hierarchy to
survive, use the menu container instead.

## extend

The DOM a container builds is flat, whatever the config nesting: every sub-tool
is a direct child. Inactive children are hidden with `hidden` and `inert` so
each sub-tool keeps its own layout.
