---
config: config/docs/tools/menu.json
tagline: Several tools behind one button, as a list you can drill into.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-menu-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [toolbox, settings, layerTree]
---

## what

The other container. Same purpose as the toolbox — many tools behind one
toolbar entry — but presented as a **list with submenus** rather than a row of
icons, with a back button and a breadcrumb.

Which to use depends on how many and how deep. A handful of siblings read
better as icons; two dozen across several groups need names and a hierarchy,
and that is a menu. Unlike the toolbox, a menu keeps its nesting.

From eight entries it also offers **search across levels**, so a tool three
groups down can be reached by typing its name rather than by remembering which
group someone filed it under.

It is keyboard-navigable as a menu should be: arrows, Home and End, left and
right to leave and enter a submenu, with a roving tab stop. Escape closes the
panel, which the panel itself handles.

## use

Open the menu, walk into a group, pick a tool. The back button and the
breadcrumb say where you are. Type to search once there are enough entries for
searching to beat looking.

## embed

Give the `menu` entry an `items` list, and nest further containers inside it for
submenus. Labels and icons for a group come from the group's own entry.

## extend

Nesting is expressed in the flat DOM as a `menu-path` attribute plus a `groups`
attribute carrying each submenu's label and icon — the container renders one
level at a time from that, rather than from nested elements it could not slot.

A modal sub-tool inside either container skips the global tool registration it
would otherwise take: the container owns exclusivity among its children, and a
globally-registered sub-tool would be deactivated behind the container's back.
