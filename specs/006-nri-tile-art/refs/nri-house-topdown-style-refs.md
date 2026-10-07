# House top-down style refs (mood / residential massif)

Inspired by modular cyberpunk **top-down** city tilesets + dystopian housing mood (do not copy assets):

## Tileset / prop language
- [Neo Zero – Cyberpunk City Top-Down](https://yaninyunus.itch.io/neo-zero-cyberpunk-city-tileset)
- [Neon Streets 16x16](https://n3cloud.itch.io/neon-streets-cyberpunk-city-pixel-tileset-16x16)
- [BeezeeBox cyberpunk exterior](https://beezeebox.itch.io/cyberpunk-sci-fi-city-exterior-16x16-tileset)
- [Flambo19 Cyberpunk City Exterior](https://flambo19.itch.io/cyberpunk-city-exterior)
- [SakPix rooftops / building tops](https://sakpix.itch.io/cyberpunk-pixel-art-asset-pack)
- [rafazcruz Cyberpunk City Asset-Pack](https://rafazcruz.itch.io/cyberpunk-top-down-game-asset-pack)

## Housing mood (dense massif / despair)
- Gritty apartment block language: pipes, AC, rooftop tanks, balconies as lived-in hive ([pixie.haus apartment decay](https://pixie.haus/pixelart/1463964/urban-grid-128))
- Blade Runner tenement / Moebius apartment rooftop — endless identical days, rain, sodium light
- Project moodboard: `nri-district-target-look.jpg` (rain/neon mood)
- Roof palette: **cool only** — charcoal, slate, steel, muted magenta. No amber/rust/sepia/sodium warm cast.

## Map vs popup
- Map: `district-house-top.png` / `district-house2-top.png` — zenith **residential roof mass** + thin sidewalk ring
- Popup: `district-house-iso.png` — ¾ face

## Hard constraints
- No baked roads / lane paint / crosswalks (roads = procedural)
- Roof palette: cool charcoal / slate / steel + muted magenta — **no warm tones**, avoid loud cyan metal roofs
- Roof fills most of the cell so neighbors form a visual housing massif
- Rooftop clutter = people-functions (AC, tanks, laundry, cables, tired neon)

## Latest pass
- Active map tops: panel aerial **A** / **B** (`tmp/art-wip/house-panel-neonbelow-*`)
- Layout: long dark roof slab + side canyons; **neon/signs glow from below** (street level)
- Aerial mood ref: `nri-house-panel-aerial-ref.png` (user)
- See also: `nri-house-multistory-readability.md`
