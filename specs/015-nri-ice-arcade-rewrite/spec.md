# 015 — NRI ICE Arcade Rewrite

## Цель

Пересобрать аркаду ICE и таблицу рекордов так, чтобы:

1. не было повторов по виду / смыслу / логике / условиям победы;
2. был смысл переигрывать (вариативный seed + score за качество);
3. условия победы и поражения были явны в UI и в `guide`;
4. easy / medium / hard ощутимо отличались параметрами и очками;
5. новые механики адаптировались под netrunner / corp ICE тематику.

## Аудит дублей (до)

| Семейство | Было | Решение |
|-----------|------|---------|
| Memory / Simon | `port_sweep`, `mesh_jack` | оставить Port Sweep; заменить Mesh → **Dead Sector** |
| Timing / reaction click | `vuln_scan`, `packet_sniff`, `signal_lock` | оставить Firewall Sweep; Sniff → **Handshake Drill**; Signal → **Noise Floor** |
| Hex sequence pick | `trace_rush`, `buffer_flood`, `hash_crack` | оставить Breach Matrix; Daemon → **Opcode Forge**; Hash → **Keyspace Prune** |
| Word guess | `auth_bypass` (цвета), `likeness_vault` (LIKENESS) | оставить оба — разная обратная связь |
| Filter reaction | `log_wipe` | оставить |
| Lane dodge | `proxy_dodge` | оставить |
| Pipe rotate | `circuit_splice` | оставить |
| Graph capture | `node_capture` | оставить |
| Multi-phase | `gibson_ice` | оставить |

## Каталог (17 игр)

| id | engine | Механика | Win | Fail |
|----|--------|----------|-----|------|
| gibson_ice | gibson | 3 фазы | exfil | TRACE / ban |
| port_sweep | sequence | memory + режимы ECHO/REVERSE/NOISE | все раунды | TRACE / аномалии |
| vuln_scan | scan | клик по OPEN, не BAIT | все волны | TRACE / промахи |
| trace_rush | breach | матрица row/col | целевая цепочка | буфер / TRACE |
| opcode_forge | stack | собрать opcode-цепочку в порядке | цепочка верна | TRACE / ошибки |
| keyspace_prune | constraint | Mastermind по hex | точный секрет | попытки / TRACE |
| handshake_drill | handshake | выбор верных ответов протокола | все шаги | TRACE / ошибки |
| auth_bypass | wordle | цветные буквы | угадать слово | попытки |
| log_wipe | logwipe | клик только red | N threat-строк | время / white click |
| dead_sector | toggle | Lights Out по сетке ICE | все клетки OFF | TRACE |
| proxy_dodge | dodge | 3 полосы, уворачивайся | все волны | лимит попаданий |
| noise_floor | balance | два слайдера → SNR в зоне | удержать N сек | TRACE / drop |
| circuit_splice | circuit | крутить пайпы | CORE под током | TRACE |
| likeness_vault | likeness | LIKENESS count | угадать | попытки / TRACE |
| node_capture | capture | граф probes | захватить CORE | probes / TRACE |
| cipher_rings | rings | выравнивание глифов на кольцах (BLACKSUN-style) | все rings aligned | TRACE |
| bit_sweep | mines | minesweeper / ICE-мины | все safe открыты | мина / TRACE |

Удалённые id (больше не в каталоге): `buffer_flood`, `hash_crack`, `packet_sniff`, `mesh_jack`, `signal_lock`.

## Сложность

Каждая игра задаёт **свои** overrides; между тирами MUST быть заметный скачок хотя бы по 2 осям (длина задачи, скорость TRACE, лимит ошибок, окно времени).

В карточке и в HUD во время игры показывать:

- `guide.win` / `guide.fail`;
- `diffHint` для выбранного тира (кратко: что ужесточается).

Очки аркады (не Gibson):

```
base(easy|medium|hard) + floor(base * qualityPct / 100)
qualityPct ∈ [0..100] ≈ чистота забега (100 − trace, остаток попыток и т.п.)
поражение → 0
```

База: easy 120 · medium 320 · hard 700 — чтобы hard-рекорд не перекрывался «лёгкими фармами».

## Реиграбельность

- Генерация от seed (`Date.now()` / раунд) — новая раскладка каждый запуск.
- Рейтинг стола = лучший score на игру; качество забега двигает score внутри тира.
- Gibson по-прежнему считает bits / exfil / trace отдельно.

## Out of scope

- Сетевой PvP / ELO между столами.
- Замена Gibson multi-phase.
- Миграция исторических строк лидерборда со старых id (они просто перестают отображаться).

## Зависимости

- `src/logic/nriGameCatalog.ts`
- `shared/nri-domain/iceLeaderboard.ts`
- `src/components/games/*`
- seeds `icebreakers-nri.json` (protected file gameId)
