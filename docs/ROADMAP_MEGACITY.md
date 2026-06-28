# Roadmap: мегаполис, perf, импланты, предметы, UI/UX

Документ фиксирует стратегию развития Neon Protocol (NRI + платформа). Опирается на `v6-district-grid`, Carbon 2185 cyberware, JSON-каталог предметов, `NRI_DISTRICT_GRID.md`, `PITCH.md`, `BACKLOG.md`.

**Северная звезда:** игрок чувствует масштаб не через количество отрисованных домиков, а через иерархию, плотность информации и «невидимую глубину».

| Слой | Что чувствует игрок | Аналог |
|------|---------------------|--------|
| **Макро** | «Город на миллионы, я — песчинка» | карта метро, обзор Night City |
| **Мезо** | «Я в Кабуки, это свой мир» | район с характером, фракции, POI |
| **Микро** | «Вот конкретная улица, лот, бар» | клетка / сцена / интерьер |

---

## 1. Карта и ощущение мегаполиса

### 1.1 Три уровня вместо двух

Промежуточный уровень **«квартал» (quarter / block)** между районом и клеткой:

```
Neon City (6 мегарайонов, ~30+ районов)
  └── District (Watson / Kabuki) — стиль, фракция, население
        └── Quarter (Северный блок, Рынок, Доки) — 4–9 на район
              └── Cell grid (8×8 … 16×16) — только внутри квартала
```

**Реализация в данных:** `parentZoneKey` уже есть → квартал = зона с `parentZoneKey = district` без `gridRow/gridCol`, с `quarterIndex` и обложкой-PNG. Клетки: `parentZoneKey = quarterKey`.

**Референсы:** Foundry Augur Nexus (иерархия локаций), Click Adventure (граф переходов), subway-map dashboards (абстракция, не география).

### 1.2 Плоские картинки

| Уровень | Визуал | Интерактив |
|---------|--------|------------|
| **City** | Skyline + цветные зоны | клик → район |
| **District** | Flat illustration + hotspots кварталов | клик → квартал |
| **Quarter** | мини-иллюстрация или сетка | клик → grid |
| **Cell** | PNG-спрайт или SVG | travel, POI |

VTT best practice: grid-off PNG, 128 px/клетку, day/night, модульные кварталы.

### 1.3 «Миллионы жителей» без симуляции

Diegetic UI, не физика:

```ts
populationBand: 'under_50k' | '50k_500k' | '500k_2m' | 'megablock'
densityLabel?: string
trafficLevel?: 0 | 1 | 2 | 3
nightlifeLevel?: 0 | 1 | 2 | 3
```

Показывать: тултип района, шапка drill-down, автоподстановка в лор.

### 1.4 Связность города

- **`linksTo`** на `exit`-клетках → сосед + время в пути
- **Магистрали** — быстрый travel между мегарайонами
- **Metro** — абстрактный граф станций

### 1.5 Сколько клеток

| Тип | Клеток | Примечание |
|-----|--------|------------|
| Спальный квартал | 10×10 – 12×12 | дома, дворы |
| Рынок / Чайнатаун | 14×14 | плотная застройка |
| Корп-кампус | 8×8 | крупные POI |
| Промзона | 16×8 | вытянутые блоки |
| Сюжетная сцена | 1 клетка | point-and-click |

Лимит: ~150 видимых тайлов → viewport culling.

### 1.6 Ориентиры

2–3 landmark на мегарайон на city map; POI крупнее generic-клеток.

### 1.7 Дорожная иерархия

`roadClass: arterial | local | alley` — ширина полосы, фары, тёмные переулки. Магистраль не тупик.

---

## 2. Производительность: ПК и мобильные

| Проблема | Решение | Приоритет |
|----------|---------|-----------|
| Много SVG-анимаций | PNG + CSS budget + LOD | P0 |
| Вся сетка в DOM | Virtualized grid | P1 |
| District на телефоне | Lite map mode | P1 |
| Poll 12s | SSE/WebSocket позиций | P2 |
| PATCH при edit | Debounce | P1 |
| Спрайты | SW cache `map-tiles/` | P3 |

**Мобильный UX:** bottom tab bar `<640px`, touch 44px, pinch-zoom, long-press на клетке, wizard в cyber-конструкторе.

**Код:** вынести `useNriMap`, `useNriInventory` из `useGameState.ts`.

---

## 3. Импланты (Carbon 2185)

### P0 — починить

1. `attacksFromAugmentations` — `blueprint.partIds` / `features`, не `itemId`
2. Grant — сохранять `build.effects` в `item.cyber`
3. `c2185Mods` имплантов → `effectiveSheet`
4. Uninstall route + sync client/server

### Игровой цикл

Риппердок → осмотр → BT/слоты → операция → установка → ICE-ban, encumbrance.

**UI игрока:** Install из инвентаря, слоты на листе, снятие только у риппердока.

### Эффекты в механику

| Effect | Применение |
|--------|------------|
| `weapon_smartlink` | бонус атаки |
| `vision_uv` / `currency_uv` | кошелёк, метки |
| `vision_thermal` | скрытые NPC |
| `net_deep_scan` | ICE minigame |
| `surveillance_detect` | патруль в сценарии |
| `weapon_conceal` | обыск |

### BT, магазин, именование

Шкала BT на листе; `inShop` + `vendorNpcId`; в UI развести C2185 cyberware / solo deck implants / ICE hardware.

---

## 4. Предметы

- Zod `NriInventoryItem`
- `weightLb` в каталоге
- Quick slots (1–3)
- Цены × модификатор района
- Долгосрочно: `shared/item-types.ts` для solo + NRI

---

## 5. UI/UX

**NRI nav:** Player — Карта · Лист · Чат · Инвентарь; Host — + Мастер · Cyber · NPC.

**Карта-терминал:** breadcrumb, легенда, слои (обзор / навигация / лор / мастер).

**Микро:** карточка клетки, preview destination, transition drill, a11y, онбординг.

---

## 6. Фазы

### Фаза A — город ощущается большим

| # | Задача | Критерий |
|---|--------|----------|
| A1 | `populationBand`, `trafficLevel` + UI | тултип «~800k» |
| A2 | `linksTo` на exit + travel time | переход в соседний квартал |
| A3 | District PNG + hotspots | иллюстрация → квартал → сетка |
| A4 | Landmarks на city map | 2 якоря на мегарайон |
| A5 | Синк `NRI_DISTRICT_GRID.md` | док = код |

### Фаза B — импланты и предметы

| # | Задача | Критерий |
|---|--------|----------|
| B1 | Фиксы cyber grant/attacks/mods | лист и бой |
| B2 | Player install + uninstall | из инвентаря |
| B3 | 5 cyber effects | smartlink, UV, deep_scan |
| B4 | Zod inventory + weight | corrupt не ломает |
| B5 | Quick slots | 1 tap use |

### Фаза C — perf + mobile

| # | Задача | Критерий |
|---|--------|----------|
| C1 | Bottom nav NRI | 375px |
| C2 | Viewport culling | 12×12 плавно |
| C3 | Lite map mode | слабые устройства |
| C4 | `useNriMap` | меньше ре-рендеров |
| C5 | Спрайты top-5 placeType | house, shop, … |

### Фаза D — глубина

Quarter в данных, metro-граф, day/night PNG, fog of war, sub-tile → lore, E2E.

---

## 7. Решения (выбор продукта)

1. **Плотность:** (B) кварталы внутри района — рекомендуется
2. **Визуал клеток:** (B) PNG здания + SVG дороги — рекомендуется
3. **Лор:** (B) автоген + правки мастера — рекомендуется

---

## 8. Антипаттерны

- Не рисовать весь город клетками
- Не симулировать миллионы NPC
- Не iso без clip pipeline
- Не effects без механики
- Не коммитить `dev.db` / `tmp/`

---

## 9. Референсы

- [CP2077 Night City analysis](https://iuliu-cosmin-oniscu.medium.com/cyberpunk-night-city-analysis-5911f985992)
- [Urban Planning in Games](https://www.youtube.com/watch?v=Q3Scw3dzxWE)
- [Foundry Augur Nexus](https://foundryvtt.com/packages/augur-nexus)
- [TouchVTT](https://github.com/Oromis/touch-vtt)
- [Sqyre planet dashboards](https://www.sqyre.app/blog/planet-dashboards)
- `docs/NRI_DISTRICT_GRID.md`

---

## 10. Статус реализации

| ID | Статус | Примечание |
|----|--------|------------|
| A1 | ✅ | поля + UI тултип/шапка |
| A2 | ✅ | `linksTo`, travel на exit-клетках |
| B1 | ✅ | cyber attacks, effects на grant, mods на листе |
| A4 | ⏳ | landmarks — следующая волна |

*Обновлять при закрытии задач фазы.*
