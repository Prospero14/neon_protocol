# Plan: NRI district map (megacity map slices)

> Spec Kit · map-срезы из бывшего `docs/ROADMAP_MEGACITY.md` §1–2 · полный roadmap: [../007-product-vision/roadmap.md](../007-product-vision/roadmap.md)

**Северная звезда:** масштаб через иерархию и плотность информации, не через число домиков.

## Code anchors

| Зона | Путь |
|------|------|
| Grid model | `shared/nri-domain/districtGrid*` / zones |
| Visual | `districtTileVisual.ts`, `districtTileSprites.ts` |
| UI | `NriCityMapPanel.tsx`, `NriDistrictTile.tsx`, `NriCellInspectPopup.tsx` |
| Routes | `server/services/nriMapRoutes.ts`, `nriMapZones.ts` |
| Contracts | top-level `zoneKey` stable; cells `{parentZoneKey}__{row}_{col}`; `rootMapZoneKey()` for Cartographer |

## Target hierarchy (roadmap)

```
Neon City (6 мегарайонов, ~30+ районов)
  └── District — стиль, фракция, население
        └── Quarter (4–9 на район) — опциональный промежуточный уровень
              └── Cell grid (8×8 … 16×16)
```

Данные: `parentZoneKey` уже есть → quarter = зона без `gridRow/gridCol` + `quarterIndex`; cells `parentZoneKey = quarterKey`.

## Visual levels

| Уровень | Визуал | Интерактив |
|---------|--------|------------|
| City | Skyline + цветные зоны | клик → район |
| District | Flat + hotspots кварталов | клик → квартал |
| Quarter | мини-иллюстрация или сетка | клик → grid |
| Cell | PNG/SVG спрайт | travel, POI |

Канон камеры на клетке: **top** на карте, **¾ iso** в попапе — [editor-wishes.md](./editor-wishes.md).

## Diegetic density (без симуляции миллионов)

```ts
populationBand: 'under_50k' | '50k_500k' | '500k_2m' | 'megablock'
densityLabel?: string
trafficLevel?: 0 | 1 | 2 | 3
nightlifeLevel?: 0 | 1 | 2 | 3
```

## Connectivity / roads

- `linksTo` на `exit`-клетках
- Магистрали / metro graph (roadmap)
- `roadClass: arterial | local | alley`

## Perf (map-related)

| Проблема | Решение | Приоритет |
|----------|---------|-----------|
| Много SVG-анимаций | PNG + CSS budget + LOD | P0 |
| Вся сетка в DOM | Virtualized grid | P1 |
| District на телефоне | Lite map mode | P1 |
| PATCH при edit | Debounce | P1 |
| Спрайты | SW cache `map-tiles/` | P3 |

## Related

- Spec: [spec.md](./spec.md)
- Editor canon: [editor-wishes.md](./editor-wishes.md)
- Tile art: [../006-nri-tile-art/](../006-nri-tile-art/)
