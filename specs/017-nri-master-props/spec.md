# 017 — Мастерские пропы + броски C2185

## Цель

NRI-стол: мастер держит реквизит и состояние; система считает броски по Carbon 2185 и показывает разбор пула. Игроки не кликают «двери мира» сами.

## Play basket («для игры»)

Сессионный staging-лист мастера. Entry: `id`, `catalogId?`, `label`, `qty`, `itemKind: ordinary|quest`, `source?`, `notes?`, опциональный `lock`.

Действия: add from catalog, pull from NPC/player inv (copy), grant to player, remove.

## Lock tags

Lock = тег + state на объекте сцены (basket entry / vehicleId / free label).

Поля: `kind` (door|vehicle|safe|drawer|shelf|crate), `method`, `dc`, `state` (locked|unlocked|jammed|broken).

Мастерская доска: список, toggle state. Attempt helper с бонусом `g_lockpick`.

## Броски C2185

Формула: `d20 + abilityModifier(effectiveScore) + proficiency? + item whitelist`.

`effectiveScore` = base + condition `abilityMods` + psychosis scar + installed implant `c2185Mods` + equipped gear `c2185Mods` (score deltas, не flat к d20). В разборе — строка score→mod при ненулевых дельтах.

Варианты: ability, skill, save, attack, initiative, death, lockpick.

Visibility: `table` | `host_and_roller` (видят только бросавший и мастер).

Под итогом — короткий разбор термов (+ notes имплантов/статусов).

## Out of scope

Автоспавн замков на тайлы; CRPG combat resolver; lockpicking minigame; полный парсинг всех item-модов.
