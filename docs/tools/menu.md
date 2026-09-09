---
config: config/docs/tools/menu.json
tagline: Puts several tools behind one menu button.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-menu-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [toolbox, settings, layerTree]
---

## what

Menu is a container for other tools. It puts many tools behind one toolbar
entry, as a **list with submenus**, a back button, and a breadcrumb.

Use Menu when there are enough tools to need names and groups. Unlike Toolbox,
Menu keeps nested groups.

From eight entries it also offers **search across levels**.

It supports keyboard navigation: arrows, Home and End, left, and right for
submenus, and Escape to close the panel.

## use

Open the menu, walk into a group, pick a tool. The back button and the
breadcrumb say where you are. Type to search once there are enough entries for
searching to beat looking.

## embed

Give the `menu` entry an `items` list, and nest further containers inside it for
submenus. Labels and icons for a group come from the group's own entry.

## extend

Nesting is expressed in the flat DOM as a `menu-path` attribute plus a `groups`
attribute with each submenu label and icon. The container renders one level at
a time from that.

A modal sub-tool inside a container skips global tool registration. The
container controls which child is active.
