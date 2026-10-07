---
name: nri-tile-art
description: Generates and installs Neon Protocol (NRI) district map tiles (house/shop/shack top+iso PNGs). Use when the user asks to draw, generate, remake, or iterate map-tile art, roofs, isometric inspect sprites, knockout alpha, gallery drop-in, or PixelLab/GenerateImage for the city map.
---

# NRI tile art

1. Read **`specs/005-nri-district-map/editor-wishes.md`** (taste wins over older prompt templates).
2. Follow SOP in that file, section **«Агент: как рисовать»**.
3. Pipeline details: `specs/006-nri-tile-art/plan.md`. Spec: `specs/006-nri-tile-art/spec.md`. Cursor rule: `.cursor/rules/nri-tile-art.mdc`.
4. Refs: `specs/006-nri-tile-art/refs/`.

Never invent a new camera language. Map = zenith `*-top.png`; popup = ¾ `*-iso.png`. Roads stay procedural. Cool palette only.
