# Neon Protocol — состояние проекта

Краткий снимок актуальных подсистем (обновлено 2026-06).

## NRI (Carbon 2185) — настольный режим

- **Лобби** с вкладками: чат, карта, кошелёк, персонажи, кибер, сценарий, **МАСТЕР**, заметки.
- **МАСТЕР**: схема боя (боевики из БД), кубики, статусы игроков, генерация (игроки / НПС / боевики).
- **Статусы**: conditions на листе, мастер вешает вручную; расходники через `POST .../player/items/:id/use`.
- **Shared domain**: `shared/nri-domain/` — conditions + consume (клиент и сервер).
- **Каталог**: `shared/nri-item-catalog.json` + `shared/nri-consume-effects.json` (все consumable/drug покрыты).

## Solo / Coop

- Solo: модульный мир (`src/logic/world/`), квесты, карточный бой.
- Coop: live-матчи в `CoopLiveMatch` (SQLite); presence-лобби in-memory; рейтинги в Prisma.

## Документация и качество

Канон SDD: `specs/README.md` · `specs/constitution.md`

- `specs/007-product-vision/backlog.md` — сводный бэклог
- `specs/007-product-vision/pitch.md` — питч
- `specs/001-platform-core/plan.md` — стек и архитектура
- `specs/007-product-vision/debt.md` — SOLID / долг
- Тесты: `npm test` (логика + HTTP integration + catalog contracts).
- Сборка: `npm run build` (Vite + client/server `tsc`).

## Известный долг

- `useGameState.ts` — крупный модуль (см. debt / 001 tasks); nriService/createApp уже разрезаны.
- Coop online-list (heartbeat) — in-memory, не критично для матчей.
- Мастерские статусы через PATCH листа — без серверной валидации condition id.

---

*Ранее: ветка `feature/stable-world-audit` — модульный мир 18 районов, 0 ошибок validate-dialogues.*
