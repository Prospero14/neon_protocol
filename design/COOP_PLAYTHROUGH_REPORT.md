# Отчёт: логическое прохождение коопа junior → mid (2026)

Это **не запись сессии в браузере**, а согласованный с кодом сценарий: как устроен путь тира, что меняется в бою и в колодах после правок.

## Условия выхода на mid

- Тир **junior** на полигоне `coop_yard`: нужно закрыть **15** обычных миссий с id вида `coop_yard_ju_XXX` (см. `coopMissionsRequiredForBoss` / `COOP_JUNIOR_MISSIONS_FOR_BOSS`).
- Первые **10** — онбординг «Банк» (фиксированные описания), **11–15** — пул Codewars после разблокировки стадии (`isCoopCodewarsStageUnlocked`).
- Затем доступен босс **`coop_yard_boss_ju`**. Победа в босс-миссии вызывает `registerCoopYardMissionClear` → `nextCoopTierRank('junior')` → **`coopTierRank` становится `mid`** (`useGameState` + `coopYardRuntime`).

## Что «игралось» в бою (логика)

1. **Пул оппонентов** больше не ограничен базовым `BUGS`: случайный выбор из **`ALL_ENEMIES`** (все обычные враги + ICE с личностями TRACER / AUDITOR / PHANTOM / SNIFFER), кроме `enemy_sysadmin` (он остаётся для специальных цепочек / copy_logs / execution chain).
2. **Новые профили давления** (в `BUGS`): *Quota Overmind*, *Chaos Runner CI*, *Perimeter Wraith* — больше сочетаний `problemType`, инъекций статусов и спавна на шине; веса `pickNextBugAction` чуть чаще тянут тяжёлые удары в верификации и по BUSINESS_RISK / TECH_DEBT.
3. **Синергии колоды (не-dev)** — в `coopCombatRole` и бою:
   - **QA:** `react_trace_jam` → затем `react_spoof_id` на ICE; `react_bug_repro` → `react_root_cause`; `react_log_mask` → `react_firewall_patch` (всё в **одном ходу игрока**, порядок снятия багов учитывает `turnPlaysRef`).
   - **Admin:** `script_ping` → затем `script_ssh` или `script_auth` на баг.
   - **PM:** `soft_coffee` → затем любой `soft_*` на ICE; в архитектуре **SOFT-слоты:** `soft_coffee` → `soft_focus`; `soft_deadline_trance` / `soft_signal_prediction` → `soft_buffer_flush`.
4. **Конструктор колод:** пакет QA **stress_chaos** расширен под пары и расследование (`react_boundary_case`, `react_bug_repro`, `react_root_cause`).

## Как это ощущается по ролям

| Роль | Зачем собирать деку |
|------|---------------------|
| **Developer** | Как раньше: языковое ядро, цепочки на шине; плюс общий пул врагов стал шире — нужны устойчивые паттерны под разные `problemType`. |
| **QA** | Иметь в руке пары под синергии и outplay по типу сбоя; иначе теряется бесплатный срез THREAT/mitigation. |
| **Admin** | Держать сетевой стек подряд (ping → ssh/auth) под усиление снятия ICE. |
| **PM** | Строить SOFT-цепочки (кофе → фокус / прогноз → flush) и иметь запас SOFT под стресс-модель коопа. |

## Автоматические проверки

- `npm test` — в т.ч. `coopBugClearSynergy` и `coopPmSoftSynergy` в `economyAndCoopCombat.test.ts`.
- `npm run build` — клиент и `tsconfig.server.json`.

## Ограничение честности отчёта

Интерактивный UI не запускался агентом: поведение выведено из `useCombatLogic`, `combatEnemies`, `coopYardRuntime`, `useGameState` и прогона тестов.
