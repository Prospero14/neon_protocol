# Editor wishes: NRI map / interaction canon

> Spec Kit · канон UX и вкуса · [spec.md](./spec.md) · пайплайн [../006-nri-tile-art/plan.md](../006-nri-tile-art/plan.md)

**Канон для агента.** При любых правках тайлов, галереи, `NriCityMapPanel` / `NriDistrictTile` / попапа клетки — сверяйся с этим файлом.  
Обновляй документ, когда пользователь явно меняет вкус; не выдумывай новые правила без запроса.

Связанные техдоки (не дублировать, а ссылаться):

| Документ / артефакт | Роль |
|---|---|
| [spec.md](./spec.md) | Модель сетки, placeType, стили, соседи |
| [../006-nri-tile-art/plan.md](../006-nri-tile-art/plan.md) | Пайплайн Generate → knockout → `public/map-tiles` |
| [../006-nri-tile-art/prompts.md](../006-nri-tile-art/prompts.md) | Старый шаблон (iso + amber). **Wishes важнее** при конфликте |
| [`.cursor/skills/nri-tile-art/SKILL.md`](../../.cursor/skills/nri-tile-art/SKILL.md) | Cursor skill: триггер «нарисуй тайл» |
| [`.cursor/rules/nri-tile-art.mdc`](../../.cursor/rules/nri-tile-art.mdc) | Always-on правило на refs/map-tiles/gallery |
| [../006-nri-tile-art/refs/nri-house-topdown-style-refs.md](../006-nri-tile-art/refs/nri-house-topdown-style-refs.md) | Рефы tileset / mood |
| [../006-nri-tile-art/refs/nri-house-multistory-readability.md](../006-nri-tile-art/refs/nri-house-multistory-readability.md) | Как читать этажность сверху |
| [../006-nri-tile-art/refs/nri-district-target-look.jpg](../006-nri-tile-art/refs/nri-district-target-look.jpg) | Moodboard района |
| [../006-nri-tile-art/refs/nri-house-panel-aerial-ref.png](../006-nri-tile-art/refs/nri-house-panel-aerial-ref.png) | Аэрофото панелек |
| [../006-nri-tile-art/refs/nri-house-single-topdown-space-ref.png](../006-nri-tile-art/refs/nri-house-single-topdown-space-ref.png) | Одно здание сверху + кольцо |
| [../006-nri-tile-art/refs/nri-cybermaps-block-mood-ref.png](../006-nri-tile-art/refs/nri-cybermaps-block-mood-ref.png) | Mood квартала |
| [`docs/refs/nri-house-colorcor-detail-ref.jpg`](../../docs/refs/nri-house-colorcor-detail-ref.jpg) | **Целевой цветокор + детали крыши** (принято) |

Код-якоря: `districtTileVisual.ts`, `districtTileSprites.ts`, `district-building-gallery.json`, `NriDistrictTile.tsx`, `NriCellInspectPopup.tsx`, `NriCityMapPanel.tsx`, `scripts/knockout-tile-matte.mjs`.

---

## 0. Статус на момент сборки

| Тема | Статус |
|---|---|
| Карта = orthographic **top**; попап = **¾ iso** | Принято, в коде |
| Дороги procedural, не в PNG зданий | Принято |
| Холодная палитра (без тёплых тонов) | Принято |
| Жильё = **панельки / массiv**, не «домик на поляне» | Принято; арт ещё итерации |
| Клетка house = **прямоугольная панель** ближе к соседям; ~10 вариантов крыш | Принято (пилоты v3–v6 → упрощаем) |
| **Слои:** дом PNG · дорога procedural · habitable-штамп · фонари отдельно | **Принято** (см. §1.6) |
| Фонари / уличный свет — не в PNG дома; `NriMapLampLayer` подсвечивает | Принято |
| Неон/вывески на фасаде дома — в артах/окнах; уличный свет — лампами | Принято |
| Явный выход из редактора | Сделано (`Выйти из редактора`) |
| Подсказка «Наведите на клетку…» | Убрана |

---

## 1. Карта — камера и слои

### 1.1 Два представления одного здания

| Где | Камера | Файл | Зачем |
|---|---|---|---|
| Клетка на сетке квартала | **Ортогональный top (zenith)**, без ¾ | `*-top.png` | Стыковка соседей + поворот клетки на **90°** |
| Попап осмотра клетки | **¾ isometric** (объём: крыша + две стены) | `*-iso.png` | Читаемый «дом», не схема |

- Front/back — запасные виды, не основной язык карты.
- На сетке **нельзя** полноценную изометрию / «домик на бок» — ломает ротацию и сетку.
- Moodboard `*-pilot.png` — только реф, не в галерею как игровой спрайт.

### 1.2 Модульность важнее красоты кадра

Здание на карте — **модульный тайл**, не уникальная диорама:

- Соседи рядом должны **стыковаться** (жилмассив, не каша швов).
- Перестановка / поворот клетки не должен «ломать» квартал.
- Края спрайта — **нейтральное кольцо** (см. §1.5), без уникальной разметки под один угол.
- Процедурные слои поверх/рядом: дворы, тротуары по соседям, аллеи, **дороги** (`RoadTileArt`), уличная жизнь (ларьки, лавки, авто).

### 1.3 Дороги vs здания

| Слой | Кто рисует |
|---|---|
| Асфальт, пунктир, зебры, стыки дорог | **Procedural** клетки `road` / `crossing` / curb |
| Здание (house/shop/shack/…) | PNG: **прямоугольная панель** (крыша + тонкий фасад); без дороги, без фонарей, без ларьков |
| Уличная жизнь (ларьки, лавки, авто, спорт) | **Отдельный habitable-слой** на дороге/аллее между домами (кисть/штамп) |
| Фонари / уличный свет | **Отдельно** (`NriMapLampLayer`) — подсвечивают сцену, не пекутся в house PNG |

Между домами в ряду — клетки дороги (или узкой аллеи); на них мастер кладёт habitable-заготовку. Не запекать «свой микрорайон» в каждый house.

Анти-паттерн: shop/house iso с жёлтым пунктиром и «своей» дорогой; house PNG с фонарями на углах клетки; клоны ларьков внутри каждого house (пилоты v5–v6 — урок).

### 1.4 Дворы и соседи

Дома ставятся **ближе** (массив): footprint прямоугольный, узкое нейтральное кольцо; расстояние между корпусами закрывает **дорога/аллея**, не пустой каньон внутри PNG.

| Сосед | Что между |
|---|---|
| `road` / аллея | Проезжая / служебная полоса; опционально habitable-штамп |
| `house` рядом через дорогу | Два берега улицы (2+2 полосы — на клетках `road`, не половинками в house) |
| `house` вплотную / двор | Тихий courtyard (procedural edge), без ларьков |

Во дворах тише. Жилая суета — на habitable-слое у дороги.

### 1.5 Контракт PNG (house top)

```text
┌──────────────────────────────┐
│ тонкое нейтральное кольцо    │  ← без фонарей, ларьков, авто, дороги
│  ┌────────────────────────┐  │
│  │ ПРЯМОУГОЛЬНАЯ ПАНЕЛЬ   │  │  ← шире квадрата; ближе к соседям
│  │ крыша + этажность      │  │     окна/неон фасада ок
│  └────────────────────────┘  │
└──────────────────────────────┘
```

- **Не** запекать streetlamps (они отдельным слоем дают свет).
- **Не** запекать полосу 2+2 и habitable справа (пилоты street-row — только реф композиции квартала).
- Полноразмерный спрайт ок; масса здания — прямоугольник, не «квадрат-подушка» и не 40% кадра с пустыней вокруг.

### 1.6 Слои квартала (принято)

```text
[фонари / glow]          ← NriMapLampLayer (place/erase)
[habitable stamp]        ← заготовки: ларьки, лавки, авто, спорт (кисть на road/alley)
[house / shop PNG]       ← только корпус
[road procedural]        ← асфальт, разметка, стыки
[yard/courtyard edges]   ← тонкие procedural к соседям
```

Редактор: кисть «жилая зона» кладёт штамп на дорожную клетку (или 1×2 вдоль ряда), поворот колесом; несколько вариантов штампа, чтобы ряд не клонировался.

---

## 2. Визуальный язык построек

### 2.1 Настроение (обязательно)

- Киберпанк **high-tech / low-life**.
- Даже сверху: **тоска, отчаяние, день сурка**, плотная жизнь функций людей.
- Целевой вид **собранного квартала**: как [`nri-cybermaps-block-mood-ref.png`](./refs/nri-cybermaps-block-mood-ref.png) — тёмные детальные крыши **рядом** с кусками асфальта/разметки. Дорога = отдельные клетки (`road`), не запекать перекрёсток в house PNG.
- Не курорт, не summer beach, не абстрактный «пол с blob-светом».
- Неон как усталый городской свет, не радуга-bloom поверх всего.

### 2.2 Палитра / цветокор

**Целевой кадр по цвету и деталям крыши:** [`nri-house-colorcor-detail-ref.jpg`](../../docs/refs/nri-house-colorcor-detail-ref.jpg) (v7-язык).

| Можно | Нельзя |
|---|---|
| Глубокий charcoal / почти-чёрный корпус, высокая контрастность | Плоский серый «мыльный» кадр |
| Крыша: плотный clutter (AC, цистерны, трубы, бельё, кабели) | Пустая гладкая крыша |
| Окна: смесь тёплого yellow/orange и cool purple/blue | Один плоский оттенок на всех окнах |
| Неон magenta/cyan у цоколя, мягкие ореолы (лёгкий smog) | Радуга-bloom на весь тайл / sodium streetlamp flood в PNG дома |
| Приглушённый magenta / холодный cyan как **акцент** | Синие/cyan **металлические крыши** как основной материал |

CSS на top-спрайтах: без sepia / warm hue-rotate / тяжёлого neon bloom, который разъедает стыки. Дальнейшие итерации house — **матчить этот цветокор**, раскладку дорог/жизни брать отдельно (v6).

### 2.3 Жилой дом (`house`) — целевой силуэт

Ориентиры:

- Массив рядом: [`nri-house-panel-aerial-ref.png`](./refs/nri-house-panel-aerial-ref.png).
- Одиночная клетка (кадр): [`nri-house-single-topdown-space-ref.png`](./refs/nri-house-single-topdown-space-ref.png) — **одна** крыша сверху + небольшое пространство вокруг; не копировать красную кровлю / газон / дачный вайб.

Когда **несколько клеток домов стоят рядом**, должно читаться как **жилмассив / многоэтажные панели**, не как отдельные коттеджи на поляне.

Сигналы:

1. **Одна многоэтажка на клетку**, footprint **прямоугольник** (шире квадрата), дома при расстановке **ближе** друг к другу. Не жирная «подушка» на весь кадр и не тонкая башня в пустыне.
2. **Между домами — дорога**, не пустой каньон в PNG; жизнь = habitable-штамп (§1.6).
3. **Карта = почти чистый zenith**: в первую очередь крыша сверху. **Не** показывать всю панель с десятками этажей окон — при расстановке в ряд перспектива/фасады «сходят с ума». Этажность и окна — в `*-iso.png` попапа. На top максимум тонкая тень/кромка крыши.
4. Неон на top — слабо, с уровня улицы/кромки; уличный свет — лампами поверх.
5. **Библиотека ~8–12** `artId` крыш при общем контракте края.

Неудачные итерации (не повторять):

- Абстрактный tech-floor с cyan blob.
- Полная уличная диорама / street-frontage house с дорогой+ларьками+фонарями в одном PNG (v4–v6) — ок как mood-реф квартала, **не** как канон слота house.
- Тёплый sodium / ржаво-sepia каст / курортный газон.
- Сильный синий металл крыши.
- Несколько зданий + своя улица внутри одной клетки → швы между соседями.

### 2.4 Магазин / прочее (`shop`, shack, …)

- Тот же модульный контракт: top на карте, iso в попапе, **без дороги в PNG**.
- Холодная палитра; вывеска magenta/cyan, не тёплая заливка витрины.
- Арт попапа должен быть **в одном языке** с картой (не старый «чистый корп-шоп с оранжевым ореолом»).

### 2.5 Файлы и галерея

- Галерея: `href` на `*-top.png` (карта резолвит top; попап — iso через `buildingArtViewHref`).
- Цель для жилья: **~10 слотов** с разными крышами (сейчас 2–3 записи, часть дублирует один файл — расширять реальными PNG).
- После генерации: `knockout-tile-matte.mjs` → реальный PNG+alpha; копия в `dist/map-tiles/`.
- WIP: `tmp/art-wip/` (не коммитить как канон).
- Hard-refresh / no-cache map-tiles при отладке.

---

## 3. Редактор карты — UX

### 3.1 Вход / выход

- Режим редактора — тогл для хоста на city layer.
- Подпись при активном режиме: **«Выйти из редактора»** (не «Редактор: ВКЛ» — пользователь не видел выход).
- В hint-доке явно упоминать выход.

### 3.2 Базовые действия (уже ожидаемые)

| Действие | Поведение |
|---|---|
| Выделение клетки | Клик |
| Поворот клетки | Колесо (90°) |
| Кисти placeType | Каталог «Кисти», клик = поставить |
| Поворот кисти | Колесо в режиме кисти |
| Обмен клеток | Два клика / drag |
| Откат | Undo последнего placement |
| Имя / POI / описание / стиль | Панель свойств выбранной клетки |
| Сохранить / сброс клетки | Явные кнопки в панели |

### 3.3 Что убрать / не возвращать

- Навязчивый hover-hint вроде «Наведите на клетку…» — **не показывать**.
- Не прятать выход в неочевидный тогл без слова «выйти».

### 3.4 Слои карты

- City overview → drill-down в квартал (district grid).
- Underhive — отдельный слой (не смешивать UX выхода квартала с редактором без нужды).
- Кнопка/крошка назад к Neon City / родителю должна оставаться понятной рядом с редактором.

---

## 4. Механики взаимодействия карты ↔ редактор ↔ осмотр

### 4.1 Поток мастера

1. Обзор города → выбор района → провал в сетку.
2. Вкл. редактор → кисть / выделение / поворот / обмен → правки свойств клетки → сохранить.
3. Выйти из редактора → играбельный просмотр (метки, фокус, без случайной перезаписи кистью).
4. Клик по клетке (вне деструктивных tool) → осмотр / фокус; **попап** показывает iso-арт + имя/тип/описание.

### 4.2 Контракты данных (не ломать)

- `zoneKey` топ-уровня стабилен; сабзоны `{parent}__{row}_{col}`.
- `placeType`, `districtStyle`, rotation, artId — согласованы с `districtTileVisual` / gallery.
- Дороги стыкуются по соседям; дома дают yards по соседям.
- Travel / achievements через `rootMapZoneKey()` где надо.

### 4.3 Арт ↔ геймплей

| Игрок видит | Откуда |
|---|---|
| Сетка зданий/дорог | top PNG + procedural layers |
| «Что это за место» крупно | iso PNG в `NriCellInspectPopup` |
| Дорожная сеть | только procedural |
| Погода / дождь | `NriDistrictWeatherFx` поверх, не запекать в каждый PNG |
| Лампы | `NriMapLampLayer` / place mode |

### 4.4 Согласованность стилей

- `districtStyle` (corp_clean, slum, residential, …) влияет на procedural decay/декор.
- Спрайты зданий должны оставаться **нейтрально-киберпанк cool**, чтобы стиль квартала не дрался с тёплым/пляжным PNG.

---

## 5. Критерии приёмки арта (чеклист перед drop-in)

- [ ] Top: zenith / одна крыша на клетку + узкое нейтральное кольцо; iso: ¾ cutout.
- [ ] Нет baked road / dashed lane / zebra / «3 стороны тротуара» в PNG здания.
- [ ] Кольцо со всех 4 сторон однородное (ларьки/авто/люди — не в PNG).
- [ ] Холодная палитра; нет тёплого sodium/sepia / курортного газона.
- [ ] Крыша не «синий металл».
- [ ] House рядом с house → визуально **массив**, не разрозненные коттеджи.
- [ ] Высота/неон: вывески и glow ощущаются **снизу** (пешеходная полоса / каньон).
- [ ] Rooftop clutter = люди/функции; варианты отличаются раскладкой, не языком края.
- [ ] Alpha real PNG; лежит в `public/` и `dist/map-tiles/`.
- [ ] Попап и карта одного building id не спорят по настроению.

---

## 6. Открытые развилки (решать с пользователем, не молча)

1. **Fake façade strip** vs **чистый zenith + neon-from-below** — аэропанели + неон снизу ближе к последнему вкусу; single-topdown-space реф усиливает «одна крыша + кольцо».
2. Нужны ли отдельные top-варианты под `districtStyle` (chinatown vs corp_clean) или один cool base + procedural tint.
3. Mega 2×2 жилищный двор-колодец — усилит массiv, но отдельный пайплайн.
4. Shop/shack/restaurant — довести до того же контракта, что house (сейчас house в фокусе итераций).
5. **Уличная жизнь**: **решено** — отдельный habitable-штамп на `road`/аллее; во дворах тише; фонари отдельно.
6. Разные **формы footprint** (Г / секция) в 1×1 vs оставить форму на mega 2×1 / 2×2 кистях.
7. Habitable: **не новый placeType**, а вайлдкард-штамп на `road`/аллее (поле вроде `lifeArtId` / overlay, по аналогии с `artId` у зданий). PlaceType остаётся дорогой → стыковка разметки жива. Галерея 3–4 штампа; кисть 1×1 или 1×2.

---

## 7. Агент: как рисовать (MCP, скиллы, SOP)

Это операционный слой. Вкус — §§1–2 и §8. Если шаблон в `NRI_IMAGE_PROMPT_TEMPLATE.md` противоречит (там ещё amber + iso-на-карте) — **игнорировать шаблон**.

### 7.1 Что читать перед генерацией

| Порядок | Что |
|---|---|
| 1 | Этот файл (вкус + чеклист §5) |
| 2 | Skill `.cursor/skills/nri-tile-art/SKILL.md` |
| 3 | Rule `.cursor/rules/nri-tile-art.mdc` |
| 4 | `NRI_TILE_ART_PIPELINE.md` — drop-in и knockout |
| 5 | Рефы: `nri-district-target-look.jpg`, `nri-house-panel-aerial-ref.png` |

### 7.2 Инструменты в этой сессии Cursor

Сначала `GetDynamicTools` (каталог / namespace), потом вызов. **Не выдумывать** имена MCP, которых нет в каталоге.

| Инструмент | Где | Когда |
|---|---|---|
| **`GenerateImage`** | namespace `cursor` → `CallDynamicTool` | Пользователь явно просит нарисовать / перегенерить тайл. `aspect_ratio: "1:1"`. Рефы через `reference_image_paths`. |
| **`scripts/knockout-tile-matte.mjs`** | Shell + `sharp` | Обязательно после GenerateImage: часто JPEG под `.png`, белый мат. Копирует в `dist/map-tiles/`. |
| **PixelLab MCP** | внешний (`pixellab`) | Если namespace есть в каталоге: isometric / top-down tilesets точнее GenerateImage. Если `needsAuth` — `mcp_auth`. Ключи **не** в git. |
| **image-generation / Stability MCP** | внешний | Только если подключены: generate, bg-remove, outpaint. |
| **PixelMCP / ssyubix** | local MCP | Контролируемый пиксель (line/rect), если сервер в каталоге. |
| **cursor-ide-browser** | MCP | Проверить клетку в редакторе после drop-in (Ctrl+F5 / no-cache). |
| **Penpot / Photopea** | человек или computer-use | Доводка швов; агент не обязан открывать, если knockout достаточен. |

`GenerateImage` — вызывать только когда пользователь просит картинку/арт (правило инструмента). Запросы вроде «попробуй ещё / в таком духе / нарисуй дом» = явная просьба.

Схема `GenerateImage` (проверить через `GetDynamicTools` перед вызовом):

```text
description          — полный промпт (§8 + placeType + top|iso)
filename             — без пути, напр. house-panel-neonbelow-d.png
aspect_ratio         — "1:1"
reference_image_paths — абсолютные пути к moodboard / предыдущему пилоту / user screenshot
```

Черновики обычно падают в  
`%USERPROFILE%\.cursor\projects\c-Users-ProsperianSun-neon-protocol-push\assets\`  
Копировать в `tmp/art-wip/` (gitignore). В игру — только после knockout.

### 7.3 PixelLab — как подключить (если ещё нет в каталоге)

Документация: https://www.pixellab.ai/mcp · wrapper: https://github.com/nekocon233/pixellab-mcp  

В **user** MCP config Cursor (не в репозиторий, ключ не коммитить):

```json
{
  "mcpServers": {
    "pixellab": {
      "url": "https://api.pixellab.ai/mcp",
      "headers": {
        "Authorization": "Bearer ${PIXELLAB_API_KEY}"
      }
    }
  }
}
```

После появления namespace: `GetDynamicTools` → искать `create_isometric_tile` / tileset generate → `CallDynamicTool`. Для **карты** всё равно нужен zenith top; PixelLab iso класть в `*-iso.png` (попап), не подменять top.

### 7.4 SOP одной итерации

```text
1. Brief: placeType, вид (top и/или iso), footprint 1x1 (иначе уточнить).
2. Промпт = §8 + конкретный субъект. Рефы: target-look + panel-aerial (house) + последний удачный пилот.
3. GenerateImage (часто 2–3 варианта). Не вставлять markdown-картинки повторно.
4. node scripts/knockout-tile-matte.mjs <src> public/map-tiles/district-<slug>-<view>.png
5. Gallery href указывает на *-top.png; iso резолвится заменой суффикса (districtTileSprites.ts).
6. Скопировать top → district-<slug>.png если это канон слота (house/shop/shack).
7. Убедиться, что dist/map-tiles синхронизирован (knockout обычно копирует сам).
8. Hard-refresh карты. Попап проверить iso отдельно.
```

Команды:

```bash
node scripts/knockout-tile-matte.mjs "<assets>/house-….png" public/map-tiles/district-house-top.png
node scripts/knockout-tile-matte.mjs "<assets>/house-….png" public/map-tiles/district-house-iso.png
# при необходимости:
# copy public/map-tiles/district-house-top.png → public/map-tiles/district-house.png + dist/
```

Не коммитить: `tmp/`, `dev.db`, сырые GenerateImage JPEG, ключи MCP.

### 7.5 Именование файлов

| Роль | Имя |
|---|---|
| Карта | `public/map-tiles/district-{house,house2,shop,shack}-top.png` |
| Попап | `…-iso.png` |
| Запас | `…-front.png` / `…-back.png` |
| Moodboard | `…-pilot.png` — не в галерею |
| Gallery | `href`: ` /map-tiles/district-house-top.png ` |

Резолвер: `buildingArtViewHref` подставляет `-top` / `-iso` к stem.

### 7.6 Пост-цвет (осторожно)

Разрешено слегка убрать тёплый каст / белый мат в sharp **после** knockout. Не сепия, не hue на «уют». CSS `.nri-district-tile__sprite--top` — нейтральный cool, без bloom, ломающего швы.

---

## 8. Промпты

**Канон street-block house (пилоты v18–v20):** полный master + стыковка дорог →  
[`../006-nri-tile-art/prompts-house-street-block.md`](../006-nri-tile-art/prompts-house-street-block.md)

Кратко:

```text
Map TILE 1:1, slight top-down (roof primary). Colorcor = nri-house-colorcor-detail-ref.
Wide panel house (5–6 подъездов). NO streetlamps in PNG.
ROADS ON ALL 4 EDGES, EACH 2 LANES to the frame edge — composable:
  opposite tiles → south 2+2 dual carriageway;
  side neighbors → through side avenues.
NOT a closed U-loop around one house. High-tech low-life asphalt.
Popup separately: ¾ iso. Mood: cyberpunk despair, Groundhog Day.
```

Параллельно остаётся путь «чистый house PNG + procedural `road` + lifeArtId» (§1.6). Street-block PNG — пилот цельного кадра квартала.

---

*Собрано из пожеланий сессии по district tile art / редактору + тулкит рисования (GenerateImage, knockout, опциональный PixelLab). Дальнейшие правки вкуса — только по явному фидбеку пользователя.*
