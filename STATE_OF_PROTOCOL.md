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
- Coop: in-memory лобби в `createApp.ts`, рейтинги в Prisma.

## Документация и качество

- `docs/ARCHITECTURE.md` — стек, связи, миграция бэк/фронт.
- `docs/SOLID_AUDIT.md` — технический долг и план рефакторинга.
- Тесты: `npm test` (логика + HTTP integration + catalog contracts).
- Сборка: `npm run build` (Vite + tsc client noEmit + tsc server).

## Известный долг

- `nriService.ts`, `createApp.ts`, `useGameState.ts` — крупные модули (см. SOLID_AUDIT).
- Coop in-memory не переживает рестарт процесса.
- Мастерские статусы через PATCH листа — без серверной валидации condition id.

---

*Ранее: ветка `feature/stable-world-audit` — модульный мир 18 районов, 0 ошибок validate-dialogues.*
