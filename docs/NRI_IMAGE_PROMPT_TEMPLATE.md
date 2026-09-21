# NRI / Neon Protocol — шаблон промпта для генерации изображений

Шаблон под киберпанк-карту, тайлы квартала и UI-арт проекта. Подставляй переменные в квадратных скобках.

---

## Master prompt

```text
Generate a captivating top-down isometric game-art asset for the cyberpunk tabletop RPG "Neon Protocol" (NRI). The image focuses on a [MAIN_SUBJECT] situated in [ENVIRONMENT_TYPE] under [WEATHER_CONDITION / TIME_OF_DAY]. Accent details include [DETAILS], casting soft neon glows onto wet asphalt and concrete. The camera is a clean isometric orthographic view, slightly elevated, looking down and to the side — perfect for a city-map or district-tile illustration: readable silhouette, no clutter, no UI chrome, no text overlays, no watermarks.

Lighting is soft ambient night-city fill with one hard key light (distant moon or tower floodlight) creating crisp geometric shadows. Neon signage, lanterns, and interior windows emit a subtle ethereal glow (cyan / magenta / amber) without bloom wash. Artistic style: stylized low-poly / flat-shaded game illustration — crisp edges, simplified facades, deliberate absence of photoreal textures — closer to Monument Valley / The Witness geometry, but with cyberpunk Neon City language: mega-blocks, corp towers, alleys, metro mouths, rain-slick streets.

Rendered at pristine 4K, orthographic isometric projection, clean artifact-free geometry, sharp defined edges. Atmosphere: [EMOTIONAL_TONE]. Color palette curated for Neon Protocol: deep navy and charcoal asphalt, desaturated teal shadows, muted browns/rust, warm amber lantern light, electric cyan and magenta accents — harmonious, game-readable, not purple-gradient AI cliché. Every element (buildings, cars, trees, street furniture, rocks, pipes) is simplified geometric shapes suitable for map/tile art.

Negative constraints: no photoreal skin, no crowded crowd scenes, no illegible microscopic text, no watermark, no logo, no HUD, no distorted perspective, no muddy overbloom.
```

---

## Настраиваемые переменные

| Переменная | Назначение | Примеры для NRI |
|---|---|---|
| `[MAIN_SUBJECT]` | Главный объект кадра | `corp HQ mega-block`, `2×2 neon plaza`, `chinatown restaurant strip`, `underhive metro station`, `street lantern cluster`, `slum shack row`, `police precinct tile`, `hospital wing`, `nightclub facade`, `parking lot slab` |
| `[ENVIRONMENT_TYPE]` | Окружение / слой карты | `Neon City district grid`, `Watson alley block`, `corp-clean campus`, `industrial port zone`, `Pacifica cliff fringe`, `underhive tunnel cavern`, `highway overpass ring` |
| `[WEATHER_CONDITION / TIME_OF_DAY]` | Погода / время | `rainy neon night`, `foggy underhive dusk`, `clear smoggy midnight`, `acid drizzle evening`, `dry electric night` |
| `[DETAILS]` | Мелкие акценты | `geometric street lanterns with amber halos`, `holo-billboards as flat planes`, `metro entrance stairs`, `parked blocky cars`, `dumpsters and cable spools`, `pond with flat reflections`, `gunshop neon katakana slab` |
| `[EMOTIONAL_TONE]` | Настроение | `tense but controlled`, `cozy illicit calm`, `corporate sterile menace`, `lonely underhive hush`, `vibrant street-night energy` |

---

## Пресеты

### 1) Тайл квартала — площадь

- **MAIN_SUBJECT:** `seamless 3×3 plaza mega-tile`
- **ENVIRONMENT_TYPE:** `dense residential district grid`
- **WEATHER:** `rainy neon night`
- **DETAILS:** `flat neon kiosks, blocky benches, amber lanterns`
- **TONE:** `public, slightly tense calm`

### 2) Корп HQ

- **MAIN_SUBJECT:** `monolithic corp headquarters campus`
- **ENVIRONMENT_TYPE:** `corp-clean downtown core`
- **WEATHER:** `clear smoggy midnight`
- **DETAILS:** `glass slab towers, courtyard floodlights, security barriers`
- **TONE:** `corporate sterile menace`

### 3) Подулей / метро

- **MAIN_SUBJECT:** `underhive metro station platform`
- **ENVIRONMENT_TYPE:** `underground cavern of concrete ribs and tunnel mouths`
- **WEATHER:** `foggy underhive dusk`
- **DETAILS:** `cyan guide lights, geometric lanterns, track lines as simple beams`
- **TONE:** `lonely underhive hush`

### 4) Фонари / atmosphere prop

- **MAIN_SUBJECT:** `cluster of street lantern poles`
- **ENVIRONMENT_TYPE:** `wet asphalt intersection in Neon City`
- **WEATHER:** `acid drizzle evening`
- **DETAILS:** `overlapping amber/cyan circular glows, puddle reflections`
- **TONE:** `cozy illicit calm`

### 5) Чайна-таун

- **MAIN_SUBJECT:** `row of restaurants with red-gold neon awnings`
- **ENVIRONMENT_TYPE:** `chinatown district alley`
- **WEATHER:** `rainy neon night`
- **DETAILS:** `lantern strings as geometric spheres, steam vents, market stalls`
- **TONE:** `vibrant street-night energy`

---

## Готовые промпты по placeType

Копируй целиком. Стиль общий: isometric orthographic, low-poly flat shade, Neon Protocol map/tile art, 4K, без UI/текста/watermark.

### Трущобы (`shack` / `districtStyle: slum`)

```text
Generate a captivating top-down isometric game-art asset for the cyberpunk tabletop RPG "Neon Protocol" (NRI). The image focuses on a dense cluster of crooked low-poly shacks and tin-roof lean-tos nestled within a Neon City slum district under acid drizzle evening. Accent details include rusted cable spools, stacked scrap crates, patched tarp planes, crooked amber lanterns, dumpsters, and exposed pipes, casting a weak warm glow onto wet cracked asphalt and mud. The camera is a clean isometric orthographic view, slightly elevated — readable as a district map tile or seamless mega-block of slums: no clutter, no UI, no text.

Lighting is soft ambient night-city fill with one hard distant floodlight creating crisp geometric shadows across uneven shack roofs. Interior slits and lanterns emit a subtle ethereal amber glow without bloom wash. Artistic style: pure low-poly flat-shaded game illustration — crisp edges, simplified facades, no photoreal textures — Monument Valley geometry with cyberpunk decay: leaning walls, mismatched roof slabs, alley gaps between shacks.

Rendered at pristine 4K, orthographic isometric projection, clean artifact-free geometry. Atmosphere: tense, worn, illicitly lived-in calm. Color palette: charcoal and rust browns, desaturated olive grime, deep navy puddles, muted teal shadows, sparse amber lantern light, dull magenta neon scrap sign as a flat plane. Every shack, crate, and pipe is simplified geometric shapes suitable for map/tile art (placeType: shack).

Negative constraints: no photoreal, no crowds, no readable text, no watermark, no HUD, no muddy overbloom, no luxury architecture.
```

**Короткий:**

```text
Isometric orthographic 4K Neon Protocol map tile: dense low-poly shack slums, tin roofs, scrap crates, dumpsters, crooked amber lanterns, acid drizzle night. Flat shading, crisp edges, rust/charcoal/navy/teal palette, weak warm glow. placeType shack. No UI, no text, no photoreal.
```

---

### Дома (`house`)

```text
Generate a captivating top-down isometric game-art asset for the cyberpunk tabletop RPG "Neon Protocol" (NRI). The image focuses on a block of compact low-poly residential houses (2–3 story slab apartments with flat or simple pitched roofs) nestled within a dense residential Neon City district grid under rainy neon night. Accent details include small rectangular windows with soft interior amber glow, narrow alleys, parked blocky cars, sidewalk slabs, and a few street lanterns, casting warm light onto wet asphalt. The camera is a clean isometric orthographic view, slightly elevated — perfect residential district tile: readable silhouette, uncluttered, no UI, no text.

Lighting is soft ambient night-city fill with one hard key light creating sharp geometric shadows between buildings. Window glow is subtle and inviting. Artistic style: low-poly flat-shaded game illustration — crisp edges, repeated facade modules, no complex textures — Monument Valley meets cyberpunk housing blocks.

Rendered at pristine 4K, orthographic isometric. Atmosphere: quiet residential night, slightly tense but orderly. Color palette: muted concrete greys, deep navy asphalt, soft warm yellow windows, desaturated teal shadows, restrained cyan neon strip on one facade. Every house, car, and lamp is simplified geometry for map/tile art (placeType: house).

Negative constraints: no photoreal, no crowds, no corp skyscrapers dominating frame, no illegible text, no watermark, no HUD, no purple-gradient cliché.
```

**Короткий:**

```text
Isometric orthographic 4K Neon Protocol map tile: low-poly residential house block, flat roofs, glowing windows, narrow alleys, street lanterns, rainy neon night. Flat shading, navy asphalt, warm yellow interiors, teal shadows. placeType house. No UI, no text, no photoreal.
```

---

### Дороги (`road` / `crossing`)

```text
Generate a captivating top-down isometric game-art asset for the cyberpunk tabletop RPG "Neon Protocol" (NRI). The image focuses on a clean low-poly city road segment (and optional crossing) nestled within a Neon City district street grid under rainy neon night. Accent details include dashed lane markings as simple geometric strokes, wet asphalt reflections, curb slabs, a few blocky cars or none, street lanterns with amber/cyan halos, and alley mouths at the edges — readable as a seamless road mega-tile. The camera is a perfect isometric orthographic view, slightly elevated, showcasing the road plane clearly for map stitching; no clutter, no UI, no text.

Lighting is soft ambient night fill with one hard key light casting crisp geometric shadows from curbs and poles. Neon and lantern glow reflects as flat colored planes on wet asphalt, not photoreal puddles. Artistic style: pure low-poly flat-shaded — asphalt as a single clean slab, markings as sharp polygons, Monument Valley clarity with cyberpunk night streets.

Rendered at pristine 4K, orthographic isometric. Atmosphere: empty night road, controlled and graphic. Color palette: deep charcoal/navy asphalt, muted grey curbs, warm amber lantern, electric cyan edge light, desaturated teal shadows, faint yellow dashed lines. Suitable for placeType: road or crossing; design should tile/merge as 2×1, 1×2, 2×2, or 3×3 road mega-blocks.

Negative constraints: no photoreal, no traffic jams, no readable signs, no watermark, no HUD, no warped perspective, no excessive bloom.
```

**Короткий:**

```text
Isometric orthographic 4K Neon Protocol map tile: low-poly wet asphalt road, dashed lane marks, curbs, amber/cyan lantern glow, rainy neon night. Flat shading, seamless mergeable road mega-tile. placeType road. No UI, no text, no photoreal.
```

**Вариант перекрёсток (`crossing`):**

```text
Isometric orthographic 4K Neon Protocol map tile: low-poly asphalt crossing / intersection, cross-lane marks as simple geometric strokes, wet reflections, curb corners, cyan pedestrian strip planes, amber lanterns, rainy neon night. Flat shading, crisp edges. placeType crossing. No UI, no text, no photoreal.
```

---

### Магазины (`shop`)

```text
Generate a captivating top-down isometric game-art asset for the cyberpunk tabletop RPG "Neon Protocol" (NRI). The image focuses on a low-poly street-level shop storefront (single or small row) nestled within a Neon City commercial alley under rainy neon night. Accent details include a flat neon sign slab (abstract glyphs only, not readable text), awning as a simple folded polygon, lit display window with warm interior glow, stacked crate props, and a sidewalk with amber lantern nearby. The camera is a clean isometric orthographic view — ideal shop district tile, readable silhouette, uncluttered, no UI.

Lighting is soft ambient night fill plus sharp geometric shadows; neon shop accent (cyan or magenta) and warm window glow without muddy bloom. Artistic style: low-poly flat-shaded game illustration — crisp edges, simplified facade, Monument Valley geometry with cyberpunk retail strip energy.

Rendered at pristine 4K, orthographic isometric. Atmosphere: inviting but street-tense commercial night. Color palette: charcoal facade, deep navy street, warm yellow interior, electric cyan/magenta sign glow, muted rust accents, teal shadows. Suitable for placeType: shop.

Negative constraints: no photoreal, no readable logos/text, no crowds, no watermark, no HUD, no purple soup lighting.
```

**Короткий:**

```text
Isometric orthographic 4K Neon Protocol map tile: low-poly street shop storefront, flat neon sign slab, awning, glowing window, crates, rainy neon night. Flat shading, cyan/magenta accent, warm interior. placeType shop. No UI, no readable text, no photoreal.
```

**Варианты:**

```text
# shop_asian — азиатская лавка
Isometric orthographic 4K Neon Protocol map tile: low-poly asian shop / noodle stall, red-gold neon awning planes, paper-lantern geometric spheres, steam vent cubes, rainy chinatown alley night. Flat shading. placeType shop_asian. No readable text, no UI, no photoreal.

# market — рынок
Isometric orthographic 4K Neon Protocol map tile: low-poly open market stalls in a row, canopy slabs, crate stacks, hanging geometric lamps, wet plaza asphalt, rainy neon night. Flat shading, amber/cyan glow. placeType market. No UI, no text, no photoreal.

# gunshop — оружейный
Isometric orthographic 4K Neon Protocol map tile: low-poly gunshop facade, reinforced door slab, barred display window, stark red/cyan neon strip, rainy industrial alley night. Flat shading, tense mood. placeType gunshop. No weapons detail porn, no readable text, no UI, no photoreal.
```

---

## Короткая версия (лимит токенов)

```text
Isometric orthographic 4K game art for Neon Protocol cyberpunk map: [MAIN_SUBJECT] in [ENVIRONMENT_TYPE], [WEATHER_CONDITION]. Low-poly flat shading, crisp edges, no textures, Monument Valley meets neon megacity. Soft ambient night light + sharp geometric shadows; neon/lantern glow (cyan/magenta/amber). Palette: navy asphalt, charcoal, muted rust, teal shadows, warm yellow accents. Details: [DETAILS]. Mood: [EMOTIONAL_TONE]. No UI, no text, no watermark, no photoreal.
```
