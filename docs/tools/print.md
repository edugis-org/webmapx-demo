---
config: config/docs/tools/print.json
tagline: Prints the current map view.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-print-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, layerTree, measure]
---

## what

Printing a web page that contains a map often gives a poor result: the map is
cut to the window, controls are printed too, and the legend is missing.

Print composes a page instead: A4, portrait or landscape, with a title and,
optionally, **the legend beside the map**.

It can include a **viewer link**: a permalink to the map as printed, with the
same layers and view.

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

The printed page uses the same legend component as the panel, so layer swatches
and ramps stay consistent.
