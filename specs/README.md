# Neon Protocol — Spec-Driven Development

Канон продуктовой и технической документации. Старые пути в `docs/` и `design/` — stubs со ссылкой сюда.

## Как вести SDD

1. Продуктовое изменение начинается со `spec.md` (или обновления существующего).
2. Технический подход — в `plan.md` / `data-model.md`.
3. Чеклист реализации — в `tasks.md`.
4. Новая крупная фича → новая папка `specs/NNN-slug/` (следующий свободный номер).
5. Принципы платформы — только в [`constitution.md`](./constitution.md); не дублировать в каждой спеке.

Правило агента: [`.cursor/rules/sdd-workflow.mdc`](../.cursor/rules/sdd-workflow.mdc).

## Индекс

| # | Спека | Содержание |
|---|--------|------------|
| — | [constitution.md](./constitution.md) | MUST/MUST NOT: контракты, save/sync, стиль работы |
| 001 | [platform-core](./001-platform-core/) | Стек, архитектура, ops, auth/sync |
| 002 | [solo-campaign](./002-solo-campaign/) | Solo RPG: юзкейсы и план |
| 003 | [coop-mode](./003-coop-mode/) | Coop: юзкейсы, GDD, карты, миссии |
| 004 | [nri-table](./004-nri-table/) | NRI стол Carbon 2185: юзкейсы + data model |
| 005 | [nri-district-map](./005-nri-district-map/) | Сетка квартала, UX редактора карты |
| 006 | [nri-tile-art](./006-nri-tile-art/) | Пайплайн тайлов, промпты, refs |
| 007 | [product-vision](./007-product-vision/) | Pitch, roadmap, backlog, SOLID debt |
| 008 | [external-content](./008-external-content/) | Внешний контент (Necrons WH40K) |
| 009 | [nri-roleplay-pack](./009-nri-roleplay-pack/) | Сырьё ролевки NRI: сценарий, квесты, нейминги (пока inbox) |
| 010 | [nri-ui-comfort](./010-nri-ui-comfort/) | Разгрузка текста: чипы, progressive disclosure, game-like scan |

## Связанное вне specs

| Артефакт | Роль |
|----------|------|
| [README.md](../README.md) | Онбординг, деплой |
| [CURSOR.md](../CURSOR.md) | Личная память оператора (не продукт-спека) |
| `.cursor/skills/`, `.cursor/rules/` | SOP агента |
