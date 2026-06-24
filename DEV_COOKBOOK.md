# 🦾 Dev Cookbook: Neon Protocol Deployment & Maintenance

Этот гайд предназначен для разработчиков (и AI-ассистентов), чтобы гарантировать стабильную работу **Neon Protocol** в облаке Amvera.

---

## 1. Порты и Ингресс (Ingress)
> [!IMPORTANT]
> На Amvera порт в панели управления, в `amvera.yml` и в коде сервера **обязан совпадать**.

*   **Текущий рабочий порт:** `8080`.
*   **Где менять:**
    *   `amvera.yml`: `run.containerPort: 8080`
    *   `server/index.ts`: `const PORT = Number(process.env.PORT) || 8080;`
*   **Симптом ошибки (502 Bad Gateway):** Это почти всегда означает, что сервер слушает не тот порт, который ожидает Amvera.

---

## 2. Роутинг Express 5 (Важно!)
Мы используем Express 5, который требует строгого именования параметров в wildcards.
*   **ПРАВИЛЬНО:** `app.get('*splat', ...)`
*   **НЕПРАВИЛЬНО:** `app.get('/*', ...)` или `app.get('*', ...)`
*   **Симптом ошибки (PathError):** Сервер падает сразу при запуске с ошибкой `Missing parameter name at index X`.

---

## 3. Архитектура сборки сервера
Сервер компилируется отдельно от фронтенда.
*   **Конфиг:** [tsconfig.server.json](file:///e:/.antigravity/neon_protocol/tsconfig.server.json)
*   **Команда:** `npx tsc --project tsconfig.server.json`
*   **Папка вывода:** `dist_server/`
*   Никогда не используй «сырой» `tsc server/index.ts` без конфига, это может привести к потере зависимостей (например, `db.ts`).

---

## 4. Vite и пути к статике
Vite при сборке может поместить `index.html` в подпапку `dist/src/index.html`.
*   **Решение:** Сервер в `server/index.ts` снабжен механизмом Fallback. Он проверяет наличие файла сначала в корне `dist/`, а затем в `dist/src/`.
*   Если меняешь структуру папок `src/`, убедись, что переменная `indexPath` на сервере всё еще находит файл.

---

## 5. База данных (Prisma + Better-SQLite3)
*   Инициализация `initDB()` должна быть **неблокирующей** (фоновой).
*   Если `prisma.$connect()` зависнет в основном потоке, Amvera убьет контейнер по таймауту готовности (**SIGTERM**).
*   **Путь к БД:** В облаке используй `/data/dev.db` (примонтированный диск), локально — `./dev.db`.

---

## 6. Как дебажить "немые" ошибки
Если приложение пишет «Запущено», но выдает 502:
1. Проверь логи на наличие строки `[NEON_BOOT] Server process starting...`.
2. Если её нет — ошибка в `package.json -> start` или битых импортах `.js` в ESM моде.
3. Проверь строку `[NEON_CORE] PORT: 8080`. Если там не 8080 — исправляй переменные окружения.

---

## 7. NRI (настольный стол Carbon 2185)

> Подробная карта репозитория — `docs/ARCHITECTURE.md` §4.3 и §10.  
> Юзкейсы: [NRI_USE_CASES.md](./docs/NRI_USE_CASES.md) · [SOLO_USE_CASES.md](./docs/SOLO_USE_CASES.md) · [COOP_USE_CASES.md](./docs/COOP_USE_CASES.md)  
> Правила save/sync — `.cursor/rules/save-hydration-safety.mdc`.

### 7.1 Что это и куда развиваем

**NRI** — онлайн-стол для ведущего и игроков: лобби по invite-коду, чат, листы персонажей, инвентарь, карта города, лор, сценарий, сейф файлов, инструменты мастера (кубики, статусы, генерация, отношения фракций).

| Слой | Где | Заметки |
|------|-----|---------|
| UI | `src/components/Nri*.tsx`, `NeonChatPanel`, `NriMasterToolsHub` | Мастер vs игрок — разные панели и `403 NRI_HOST_ONLY` |
| API-клиент | `src/logic/nriApi/` (barrel `nriApi.ts`) | Один модуль на зону: `lore.ts`, `map.ts`, `session.ts`, … |
| HTTP | `server/services/nriService.ts` → mount-only | Роутеры: `nriMapRoutes`, `nriLoreTravel`, `nriPlayerRoutes`, … |
| Домен без I/O | `shared/nri-domain/` | `loreCards`, `loreMarkup`, `entityTags`, `zoneIcons`, conditions, consume |
| Контент JSON | `shared/*.json` | Каталог предметов, зоны карты `nri-night-city-zones.json` |
| БД | Prisma `NriSession`, `NriPlayer`, `NriLorePlace`, `NriFaction`, … | SQLite, на Amvera — **`/data/dev.db`** |

**Префикс API:** `/neon_v1/services/nri/:code/...` (`:code` = invite, напр. `NRI-JB5X`).

**Направление разработки (2026):**
- Чистая логика — в `shared/nri-domain/`, не дублировать на клиенте/сервере.
- Сервер — тонкие роутеры + Prisma; god-файл `nriService.ts` уже разрезан (см. `docs/BACKLOG.md`).
- Лор и карта — **двусторонняя связь** (район ↔ карточка места, иконки на карте).
- Игроку в чате — только **краткая сводка** карточки (`summary`); полный лор (`body` / `description`) — только в панели мастера.
- Подсветка `[[Название]]` в чате/сценарии → `GET .../lore/cards` (read-only для участников стола).

### 7.2 Ключевые маршруты

| Маршрут | Кто | Назначение |
|---------|-----|------------|
| `GET .../map/zones` | участник стола | Районы карты (глобальные `NriMapZone`) |
| `GET .../lore` | **только хост** | Полный лор: места, фракции, записи, отношения |
| `GET .../lore/cards` | участник | Индекс для чата: title + summary, без полного текста |
| `PATCH .../lore/places/:id` | хост | Карточка места (+ sync названия/иконки с картой) |
| `GET .../players`, `PATCH .../sheet` | по ролям | Листы и инвентарь |

Клиент карты: `NriCityMapPanel` + `nriFetchMapZones`.  
Чат: `NeonChatPanel` + `nriFetchLoreCards` + `LoreMarkupInteractive`.

### 7.3 Деплой NRI на Amvera

1. **Сборка:** `amvera.yml` → `npm run build:full` (Prisma generate + vite + `tsc` сервера + копия `shared/*.json` → `dist_server/shared/`).
2. **Старт:** `npm start` → `node dist_server/server/index.js`.
3. **Миграции:** при boot — `prisma migrate deploy`; при **P3005** (старая непустая БД без history) — fallback `prisma db push`.
4. **Runtime bootstrap:** `server/services/nriSchemaBootstrap.ts` — `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE` для колонок, если migrate/push не доехали (типично для `/data` на проде).
5. **Не коммитить:** `dev.db`, `tmp/` — только код и `dist_server/`.

### 7.4 Типовые проблемы и симптомы

#### A. SQLite / Prisma на проде (самое частое для NRI)

| Симптом | Причина | Что делать |
|---------|---------|------------|
| `500` на `/map/zones` и `/lore/cards` | В `/data/dev.db` нет колонок `summary`, `iconId`, `entityTag` после деплоя нового кода | Убедиться, что задеплоен свежий `dist_server`; перезапуск → bootstrap в `nriSchemaBootstrap.ts`. Локально: `npm run build:full`. |
| Ошибка Prisma `The column X does not exist in the current database` | Старая БД, migrate не применился | Boot делает `db push`; в коде — brute-force `ALTER TABLE` в `ensureAllNriLoreDbColumns`. **Не полагаться** на regex только `no such column` — Prisma 7 пишет иначе. |
| Лор/карта падали вместе | `/map/zones` вызывал полный lore-sync до отдачи районов | Исправлено: карта — `ensureNriMapSchema` только; лор-синк — в `try/catch`, не блокирует ответ. |
| `500` только на `/lore/cards` | Эндпоинт тянул seed карты (`loadZoneSeedFile`) | Исправлено: cards только читает `NriLorePlace` / `NriFaction` / `NriLoreEntry`. |
| `Zone seed not found` | Нет `dist_server/shared/nri-night-city-zones.json` | Проверить `npm run build` (шаг `shared json → dist_server`). Пути поиска — в `loadZoneSeedFile()`. |

**Канонические файлы схемы:** `prisma/schema.prisma`, `server/services/nriSchemaBootstrap.ts`, `server/services/nriLoreSchema.ts`, `server/index.ts` (`ensureNriSchemaSync`).

#### B. Save / sync (чёрный экран, не только NRI, но ломает вход в стол)

| Симптом | Причина | Что делать |
|---------|---------|------------|
| Чёрный экран после логина / join NRI | В save `{}` вместо `[]`, частичный `game/sync` затёр `gameState` | Всегда `mergeGameStatePatch` + `sanitizeClientGameState` (`saveHydrationGuards.ts`). Не sync'ить 2–3 поля до полной гидрации (`useNriSession`). |
| NRI auto-join до гидрации | Ранний `syncGameState` | Ждать `hydrationReady` в `useNriSession`. |

#### C. Контракты API (ломают клиент при смене «в одну сторону»)

- Auth: `/neon_v1/auth/login`, `/register`, `/game/sync` — тела и коды для `AuthContext`.
- Коды ошибок `NRI_*` — клиент читает `message` / `code` (`parseNriApiError`).
- **Не переименовывать** id квестов, NPC, `zoneKey`, invite-маршруты без миграции сохранений.
- `QuestDefinition.id` ↔ `completeQuestId` в диалогах solo — отдельно от NRI, но те же правила.

#### D. Лор и чат

| Симптом | Причина | Что делать |
|---------|---------|------------|
| Ссылки `[[Место]]` не кликаются, в консоли `500 lore/cards` | См. блок A | Смотреть Network → Response → `message`. В чате теперь toast с текстом ошибки. |
| В поп-апе игроку виден весь лор / метка фракции | Старый UI | Поп-ап: **title + summary**; `entityTag` не отдаётся в `/lore/cards`. |
| Старые тексты пропали после поля `summary` | Путаница полей | Полный текст остаётся в `body` / `description`; `summary` — новое поле; fallback — начало старого текста в `buildLoreCardIndex`. |
| Битая ссылка в чате | Нет карточки с таким title | Toast «битая ссылка», без падения UI (`LoreMarkupInteractive`). |

#### E. Инфраструктура (общее с §1–§6)

| Симптом | См. раздел |
|---------|------------|
| 502 Bad Gateway | §1 Порты (`8080`) |
| `PathError` при старте | §2 Express 5 `*splat` |
| «Запущено», но API нет | §6 немые ошибки, битые `.js` импорты в ESM |
| Статика 404 | §4 Vite `dist/` vs `dist/src/` |

### 7.5 Чеклист перед пушем NRI-фичи

```text
[ ] prisma/schema.prisma + migration ИЛИ bootstrap в nriSchemaBootstrap.ts
[ ] shared/nri-domain — если логика нужна и клиенту, и серверу
[ ] npm test && npm run build
[ ] Не трогать dev.db / не коммитить tmp/
[ ] Новые поля-массивы в save → sanitizeClientGameState
[ ] Мастер-only PATCH — requireHost; игрок read — отдельный GET без лишних полей
[ ] После деплоя на Amvera — перезапуск + Ctrl+F5; при 500 смотреть message в Network
```

### 7.6 Полезные пути (быстрая навигация)

```text
server/services/nriSchemaBootstrap.ts   # таблицы + колонки SQLite на проде
server/services/nriLoreTravel.ts        # лор, фракции, lore/cards, перемещение
server/services/nriMapRoutes.ts         # map/zones, метки
server/services/nriMapZones.ts          # seed районов из JSON
shared/nri-domain/loreCards.ts          # индекс карточек для чата
shared/nri-domain/loreMarkup.ts         # [[подсветка]]
src/components/NriLorePanel.tsx         # редактор лора (мастер)
src/components/NriCityMapPanel.tsx      # карта
src/logic/nriApi/lore.ts                # клиент лора
src/logic/saveHydrationGuards.ts      # save/sync
```

---

**Удачного кодинга! Да пребудет с тобой неоновый свет.**
