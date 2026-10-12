# Prompt: house street-block tile (канон v19–v20)

> Канон вкуса: [../005-nri-district-map/editor-wishes.md](../005-nri-district-map/editor-wishes.md)  
> Цветокор/детали крыши: [`docs/refs/nri-house-colorcor-detail-ref.jpg`](../../docs/refs/nri-house-colorcor-detail-ref.jpg)  
> WIP-пилоты: `tmp/art-wip/house-roof-v18b-*`, `v19b-*`

Использовать для GenerateImage `aspect_ratio: "1:1"` + рефы из списка ниже.

---

## Стыковка дорог (обязательно понять перед генерацией)

Клетка — **не замкнутый двор-кольцо**. Дороги на краях — **вкладыши**, которые с соседями собирают проезжую часть:

| Сосед | Что складывается |
|---|---|
| Дом **напротив** (flip по Y) | Южные 2 полосы этой клетки + южные 2 полосы напротив → улица **2+2** между рядами |
| Дом **слева/справа** | Боковые 2 полосы стыкуются в сквозную магистраль вдоль ряда / между корпусами |
| Продолжение ряда | Боковые полосы **доходят до края кадра** (сквозные), без U-turn и закруглённых тупиков |

На каждом из 4 краёв клетки — минимум **2 полосы** асфальта с разметкой, edge-matched.

---

## Master prompt (copy-paste)

```text
Square 1:1 cyberpunk GAME MAP TILE for Neon Protocol district grid. Night, high-tech low-life. Color grade and roof clutter MUST match nri-house-colorcor-detail-ref: deep charcoal/black, dense AC units, tanks, ducts, laundry, cables; windows mix warm yellow/orange AND cool purple/blue; magenta/cyan neon at building base with soft smog halos. Same slight top-down camera as house-roof-v18b/v19b (roof dominant, thin south facade strip only — do NOT show a full 20-floor glass wall that breaks tiling perspective).

HOUSE: ONE wide panel apartment, about 5–6 entrance bays (подъезды), rectangular slab filling most of the center. Dense lived-in roof. Prefer ~8–12 readable window rows on the thin south strip if height is shown — without increasing perspective tilt.

ROADS — COMPOSABLE (critical):
- ALL FOUR sides of the tile have asphalt carriageway strips that run to the image edges.
- EACH side strip is TWO LANES wide with worn white dashed divider, dirty wet asphalt, thin curb toward the building.
- LEFT and RIGHT strips are MAIN THROUGH-ROADS: straight vertical bands from TOP edge to BOTTOM edge (no U-loop, no rounded cul-de-sac). Neighbors to the east/west must be able to connect these into a continuous street.
- SOUTH strip: two lanes full width edge-to-edge. When an identical tile is placed opposite (mirrored vertically), the two south strips meet and form a full dual carriageway (2+2).
- NORTH strip: two lanes as well (quieter ok) so north neighbors also compose a road.
- Do NOT paint a closed ring road that only circles one house. Roads are shared infrastructure between tiles.
- Side roads stay wide enough (true 2 lanes each), not tiny alleys.

FORBIDDEN: streetlamps / lantern poles / warm yellow corner light pools (lamps are a separate game layer). No Patreon watermark. No neat park lawn. No three market stalls filling the frame (life stamps are a separate layer later — keep ground mostly asphalt + light curb clutter only).

Mood: cyberpunk despair, dense panel housing, Groundhog Day. Tileable with copies in a row and across the street.
```

### reference_image_paths (абсолютные пути на машине пользователя)

```text
docs/refs/nri-house-colorcor-detail-ref.jpg
tmp/art-wip/house-roof-v19b-sides-through-12f-top.jpg   # или актуальный current
docs/refs/nri-cybermaps-block-mood-ref.png               # mood квартала, если есть
```

---

## Разметка вокруг одиночного дома (реф)

| Реф | Файл |
|---|---|
| Канон «вот так» (принято) | [`docs/refs/nri-house-road-markings-correct.png`](../../docs/refs/nri-house-road-markings-correct.png) |
| Старые оранжевые пометки | [`docs/refs/nri-house-road-markings-annotate.png`](../../docs/refs/nri-house-road-markings-annotate.png) |

**Пилот с ошибками:** `tmp/art-wip/house-roof-v23-no-big-triangle.png` — не копировать разметку 1:1.

### Отличия v23 от канона (зафиксировано)

| # | Канон (correct) | Что сделал v23 / типичный промах |
|---|---|---|
| 1 | **Половина** боковой дороги этой клетки; внешний край = край тайла, без «чужого» асфальта соседней клетки | Часто полное 2-полосное кольцо вокруг одного дома → при стыке двух домов получится двойная ширина |
| 2 | Зебра; **с обеих сторон** сплошная линия стоп; **STOP перед линией** (со стороны подъезда), не на зебре | STOP/линии плавают: иногда только с одной стороны, или текст слишком близко к зебре |
| 3 | На выезде на шоссе — **только ряд мелких треугольников**, основание к большой дороге | То появлялся крупный треугольник + боковые чёрточки (убраны), то ориентация/число треугольников плывёт |
| 4 | Сверху/снизу — **шоссе шире** (больше полос), **без** зебр | Горизонтальные полосы почти той же ширины, что боковые; иногда лишняя разметка |
| 5 | Без крупного yield-треугольника и без чёрточек по бокам от него | v22 имел; v23 убрал, но сверять с correct-рефом |
| 6 | Камера ближе к плоскому top; разметка читается как схема | Сильнее «домик на бок» / изо-наклон, мешает стыковке |

### Правила (кратко)

- Бока: **асфальт до края клетки** (серый бордюр / двойную белую кромку / рамку по внешнему краю **не** рисовать).  
- Стык двух клеток горизонтально (канон: [`nri-house-pair-seam-correct.png`](../../docs/refs/nri-house-pair-seam-correct.png)): правая полоса левой клетки + левая полоса правой = **одна** сквозная дорога между домами, без щели и без двойной рамки посередине. Каждая боковая полоса на тайле — **половина** этой общей дороги (разметка доходит до пикселя края).  
- Пунктир на шоссе сверху/снизу — **ровный ритм**; без дыр и обрывков на краю.  
- STOP с двух сторон зебры, L→R лицом к потоку, правостороннее.
- Пунктир + зебра; **линия стоп с обеих сторон** зебры; **STOP с обеих сторон**, текст **слева→направо лицом к транспорту**, который подъезжает к этой линии (**правостороннее** движение — каждый STOP читается своим потоком).  
- На стыке с шоссе: треугольники как на [`nri-house-side-road-markings-crop.png`](../../docs/refs/nri-house-side-road-markings-crop.png) — два мелких по краям + один крупнее по центру; основание к шоссе.  
- Верх/низ: half шоссе, больше полос, без переходов.  
- Вывод: **обычный PNG** в `tmp/art-wip/`.

## Чеклист приёмки

- [ ] По 2 полосы на каждом краю, до края кадра  
- [ ] Бока сквозные (верх↔низ), не U-кольцо  
- [ ] Юг стыкуется с зеркальным рядом в 2+2  
- [ ] Дом широкий (много подъездов), цветокор как colorcor-ref  
- [ ] Нет фонарей в PNG  
- [ ] Разметка как на annotate-рефе (зебра / STOP / стрелки)  
- [ ] Результат сохранён как `.png`
---

## Не использовать

Старый master в `prompts.md` (iso + amber на карте) — **устарел для district top**. Попап `*-iso` — отдельный промпт; этот файл только для map top street-block house.
