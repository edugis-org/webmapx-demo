---
config: config/docs/tools/print.json
tagline: The map on paper — with its title, its legend and a way back to the live version.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-print-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, layerTree, measure]
---

## what

Printing a web page containing a map generally produces something disappointing:
the map is cut to the window it was in, the controls print along with it, and
the legend — which is what makes the colours mean anything — is in a panel that
is not on the paper.

The print tool composes a page instead. A4, portrait or landscape, with a title
you give it and, if you want, **the legend printed beside the map** so the
result explains itself away from the screen.

It also offers a **viewer link**: a permalink to the map exactly as printed,
put on the page itself. A printed map is a dead end otherwise — this is how the
person holding it gets back to the live one, with the same layers and the same
view.

## use

1. Open the tool, give the map a title.
2. Choose a format: portrait or landscape, with or without the legend.
3. Optionally add the viewer link.
4. Print. Use your browser's print dialog to save as PDF if you want a file.

What is printed is the current view, so frame the map before opening the tool.

## embed

Add `print` to a toolbar. Nothing to configure.

Worth including on any map meant for classroom or fieldwork use, where the
result is carried around on paper.

## extend

The composed page is built from the same legend component the panel uses, so a
layer that shows a ramp on screen shows the same ramp on paper — there is no
second rendering of the legend to keep in step.
