# 010 — NRI UI comfort (density / game-like scan)

## Problem

Киберимпланты, карта и бой перегружены плотным текстом вплотную: тяжело сканировать, ощущение «вики», не игровой HUD.

## Principles (MUST)

1. **Три слоя:** glance (иконка/чип/число) → peek (hover/expand ≤3 строк) → study (drawer/правила).
2. **Бюджет 1-го взгляда:** у карточки/детали в свёрнутом виде не больше 3 коротких строк текста + ряд чипов.
3. **Always-on только для решения:** цена, BT, слот, перегруз, кулдаун. Лор и формулы — по запросу.
4. **Чипы > абзацы** для статов; абзац только для смысла/трейдоффа.
5. **Glow restraint:** неон для фокуса/алерта, не для декора всего экрана.

## Scope v1 (эта ветка)

- Киберимпланты: свёртка описания деталей, BT-шкала, чипы в итоге сборки.
- Inspect клетки карты: dossier-карточка (тип-чип + краткий текст + expand).
- Бой HUD: короче flash-лог (полный текст в `title`).
- Инвентарь (игрок + мастер-каталог): чипы модов/категории, blurb за «ещё», полоса активных статусов с таймером.
- Расходники/статусы: `expiresAt` для wall-clock (алкоголь и т.п.) + тесты qty/expire.

## Out of scope v1

Силуэт тела, линзы карты, ghost preview боя, полный icon dictionary.  
Авто-перенос урона из CombatBridge → см. [011-nri-combat-aftermath](../011-nri-combat-aftermath/spec.md).

## Refs

См. council canvas / референсы: CP2077 cyberware, Into the Breach clarity, NN/G progressive disclosure.  
Оболочка стола / mobile chrome — [014-nri-deck-ui](../014-nri-deck-ui/spec.md).
