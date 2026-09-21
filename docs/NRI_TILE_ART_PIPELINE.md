# NRI — пайплайн искусства тайлов карты

Канонический процесс для агента и человека: от промпта до файла в `public/map-tiles/` и записи в галерею.

Связанные файлы:

- Промпты: [`NRI_IMAGE_PROMPT_TEMPLATE.md`](./NRI_IMAGE_PROMPT_TEMPLATE.md)
- Галерея построек: `shared/nri-map-art/district-building-gallery.json`
- Галерея зон города: `shared/nri-map-art/city-zone-gallery.json`
- Спрайты на карте: `public/map-tiles/district-*.svg` (или `.png` / `.webp`)
- Резолвер: `shared/nri-domain/districtBuildingArtGallery.ts`

---

## 0) Роли инструментов

| Инструмент | Роль | Платформа | Агент может вызывать? |
|---|---|---|---|
| **Cursor `GenerateImage`** | Быстрый draft / концепт / реф для тайла | Cursor (уже есть) | **Да** — по явной просьбе пользователя |
| **PixelLab MCP** | Pixel / изометрические тайлы, wang tilesets | API key | Да, после подключения MCP |
| **PixelMCPServer / ssyubix-pixelart-mcp** | Пиксельная отрисовка примитивами (line/rect/fill) | Local MCP | Да, после установки |
| **image-generation-mcp / Stability MCP** | Flux / SD / DALL·E API | API key | Да, после ключей |
| **[Penpot](https://penpot.app/)** | Сетка размеров 1×1…6×6, раскладка спрайтов, SVG-экспорт | Web / self-host | Нет (человек или экспорт) |
| **[Compositor](https://github.com/robbietilton/Compositor)** | Доводка: слои, маски, bg remove, clone | **macOS only** | Нет |
| **Photopea / GIMP / Affinity** | То же на Windows | Win | Нет |

> На этой машине (Windows) Compositor не ставится. Для постпроцесса: **Photopea** (браузер) или GIMP.

---

## 1) Этапы пайплайна (делай по порядку)

```text
Brief → Prompt → Generate → Finish → Fit-to-grid → Drop-in → Verify
```

### A. Brief (1–3 минуты)

Зафиксировать:

1. `placeType` (например `shop`, `shack`, `road`)
2. Размер кисти / footprint: `1x1` | `2x1` | `2x2` | `3x3` | `6x6` | corner
3. Стиль района: `residential` | `slum` | `corp_clean` | `chinatown` | …
4. Формат выхода: предпочтительно **квадратный тайл**, читаемый сверху-изометрия, прозрачный фон если возможно

### B. Prompt

1. Взять master / пресет из `NRI_IMAGE_PROMPT_TEMPLATE.md`
2. Подставить `MAIN_SUBJECT`, погоду, детали
3. Добавить жёсткие constraints:

```text
orthographic isometric top-down game tile, seamless square crop, transparent or solid dark asphalt ground only,
no UI, no text, no watermark, no photoreal, flat low-poly, Neon Protocol map art
```

### C. Generate (агент)

**Уже доступно в Cursor без установки:**

- Инструмент `GenerateImage` — генерирует файл по description (+ optional `aspect_ratio`, `reference_image_paths`)
- Для тайла: `aspect_ratio: "1:1"`, description = полный промпт из шаблона
- Референсы: пути к существующим `public/map-tiles/district-*.svg` или PNG, если нужно держать стиль

**Если подключён MCP (см. §3):**

- PixelLab → `create_isometric_tile` / `tileset_generate` — ближе к game-tile
- PixelMCP / ssyubix → ручная пиксельная сборка (медленнее, но контролируемо)
- Stability / image-gen → альтернативные провайдеры

Сохранять сырьё в:

```text
tmp/art-wip/<placeType>/<date>-draft.png   # tmp/ в .gitignore
```

### D. Finish (человек или агент через API edit)

Цель: чистый спрайт под нашу тёмную карту.

Чеклист:

- [ ] фон вырезан / тёмный асфальт без «студийного серого»
- [ ] силуэт читается на `#0a0c12`
- [ ] без текста / watermark
- [ ] края не режут геометрию
- [ ] свет: cyan / amber / magenta умеренно (без purple-cliché bloom)

Инструменты: Compositor (Mac) · Photopea (Win) · Stability `remove-background` / `outpaint` если MCP есть.

### E. Fit-to-grid (Penpot)

1. Открыть [penpot.app](https://penpot.app/) (или self-host)
2. Артборд квадрат: **512×512** (или 256 / 1024 — но один размер на серию)
3. Гайдлайны под footprint:
   - `1x1` — один квадрат
   - `2x1` / `1x2` — два квадрата
   - `2x2` / `3x3` / `6x6` — сетка N×N
4. Выровнять content в «безопасной» зоне ~6–8% inset (как у спрайтов на клетке)
5. Экспорт: SVG предпочтительно; PNG с alpha — ок

Имя файла:

```text
public/map-tiles/district-<slug>.svg
```

Примеры: `district-shop.svg`, `district-shack-2.svg`, `district-plaza-2x2.svg`

### F. Drop-in (код)

1. Положить файл в `public/map-tiles/`
2. Добавить / обновить запись в `shared/nri-map-art/district-building-gallery.json`:

```json
{
  "id": "bldg_<slug>",
  "label": "Человекочитаемое имя",
  "placeTypes": ["shop"],
  "href": "/map-tiles/district-<slug>.svg"
}
```

3. При необходимости — то же для `city-zone-gallery.json`
4. `npm run build` → проверить клетку в редакторе района (кисть Выделение / постановка)

### G. Verify

- [ ] тайл виден на карте (Ctrl+F5)
- [ ] поворот колесом / `rotation` не ломает читаемость
- [ ] mega 2×2 / 3×3 (если задумано) стыкуется без швов
- [ ] не затёрли чужой `artId` / лого без нужды

---

## 2) Контракт для агента (короткий SOP)

Когда пользователь пишет «нарисуй тайл X» / «сделай арт для shop»:

1. Уточнить `placeType` + размер, если не ясно (иначе default `1x1`).
2. Собрать промпт из `NRI_IMAGE_PROMPT_TEMPLATE.md`.
3. Вызвать **`GenerateImage`** с `aspect_ratio: "1:1"` (и refs при наличии).
4. Положить draft в `tmp/art-wip/…` (или оставить путь, который вернул инструмент).
5. Предложить шаги Finish → Penpot → drop-in **или** сразу положить PNG/SVG в `public/map-tiles/` + обновить gallery JSON, если пользователь сказал «вставь в игру».
6. Не коммитить `tmp/`, `dev.db`. Коммитить только `public/map-tiles/*` + gallery JSON + docs по запросу.

---

## 3) Как подключить рисование агенту (MCP)

Уже работает без настройки: **Cursor GenerateImage**.

Чтобы агент рисовал стабильнее / пиксельнее / пачками:

### A. PixelLab (рекомендуется для тайлов)

- Docs: https://www.pixellab.ai/mcp  
- GitHub wrapper: https://github.com/nekocon233/pixellab-mcp  
- Нужен API key. В Cursor MCP settings добавить HTTP/stdio сервер с `Authorization: Bearer …`
- Плюс: `create_isometric_tile`, top-down tilesets

### B. Локальный пиксельный движок

- https://github.com/jsreed/PixelMCPServer — draw primitives + tileset export  
- https://github.com/syuaibsyuaib/ssyubix-pixelart-mcp — canvas + tileset tools  

Хорошо, если нужен **контролируемый** пиксель без облака.

### C. Универсальная генерация

- https://github.com/pvliesdonk/image-generation-mcp — OpenAI / Gemini / SD WebUI  
- https://github.com/tadasant/mcp-server-stability-ai — generate + bg remove + outpaint  

Нужны ключи провайдеров.

### Минимальный `mcp.json` (пример, ключи не коммитить)

Положить в Cursor user MCP config (не в git):

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

После подключения: в чате попросить «сгенерируй isometric tile shop через PixelLab» — агент вызовет MCP tool.

---

## 4) Penpot — быстрый стартовый layout

Рекомендуемые артборды в одном файле `NRI Map Tiles`:

| Board | Size | Назначение |
|---|---|---|
| `tile-1x1` | 512² | одиночные placeType |
| `tile-2x1` | 1024×512 | горизонтальные mega |
| `tile-1x2` | 512×1024 | вертикальные mega |
| `tile-2x2` | 1024² | площади / HQ куски |
| `logo-sheet` | 512² × N | corp logos 1×1…6×6 |

Слои: `ground` / `building` / `neon` / `props` — удобно для экспорта вариантов.

---

## 5) Compositor / постпроцесс

- Сайт: https://robbietilton.com/compositor  
- Repo: https://github.com/robbietilton/Compositor  
- Use when: вырезать фон, подчистить швы, clone грязи, подкрутить контраст под neon night  
- Windows: Photopea с тем же чеклистом §1.D

---

## 6) Definition of Done

Тайл считается готовым, когда:

1. Файл лежит в `public/map-tiles/`
2. Есть запись в gallery JSON с верным `placeTypes` + `href`
3. Виден в редакторе района после build
4. Промпт/реф при желании сохранены в `docs/` или комментарии к PR — не в `tmp/`

---

## 7) Что сделать дальше (опционально)

1. Завести API key PixelLab и добавить MCP в Cursor — агент сможет генерить изометрические тайлы точнее, чем общий `GenerateImage`.
2. Собрать в Penpot sheet со всеми текущими `district-*.svg` для визуального аудита.
3. По запросу пользователя — прогнать один placeType end-to-end (например `gunshop`) как smoke-test пайплайна.
