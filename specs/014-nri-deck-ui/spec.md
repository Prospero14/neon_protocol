# 014 — NRI Deck OS (shell UI)

> Игровой киберпанк-HUD оболочки стола + mobile-first.  
> Density/progressive disclosure — [010](../010-nri-ui-comfort/spec.md). Здесь — identity оболочки и touch.

## Problem

Лобби читается как админ-панель с неоновой обводкой: вкладки wrap-хаосом, состав — длинная строка, формы — десктопные. Нужен **операторский дек**, удобный и на телефоне.

## Metaphor: Deck OS

Стол = личный дек: вкладки = каналы, telemetry-strip = состав/статус, тело = активный модуль.  
Мастер = admin shell (плотнее); игрок = field UI (чище).

## Principles (MUST)

1. **Три слоя** (из 010): glance → peek → study.
2. **Glow restraint**: accent только active / alert / focus — не каждый border / не solid-fill на всех табах.
3. **Mobile-first** &lt; ~768px: одна колонка; desktop grids = enhancement.
4. **Tab bar**: горизонтальный scroll + snap, **touch ≥ 44px**, без 4-строчного wrap.
5. **Telemetry chips**: состав / spam / live — scroll-ряд, не `·`-строка.
6. **Sticky primary** на длинных формах (досье).
7. **Safe-area / dvh**: notch и IME не прячут controls.
8. **`prefers-reduced-motion`**: короткие жесты отключаются.

### Densify ≠ shrink below touch

«Кнопки слишком большие» = лишний **визуальный вес** (заливка, градиент, жирный border на inactive), не повод ронять hit-area ниже 44px.  
Плотность: quiet inactive + underline/inset active + компактный mono-label **внутри** 44px.  
Иерархия хрома: channel tabs (каналы) → subtabs (модуль) → nested (подмодуль); каждый слой quieter предыдущего.

### Module stage (MUST)

Тело вкладки живёт в **одной** рамке `.nri-lobby__stage` (border + panel + flex-fill).  
Переключение каналов **не** меняет ширину/offset контента — только внутренний модуль.  
Субтабы (чат / люди / мастер) — внутри той же коробки, не отдельные «коробочки» с другим padding.

**Hard lock:** каждый прямой потомок stage = `position: absolute; inset: 0` (одинаковый W×H).  
Запрещены свои `height`/`max-height`/`max-width` на корне модуля внутри stage (чат `70dvh` и т.п. — override).

**Два layout-класса корня (все каналы лобби):**

| Layout | Корни | Поведение |
|--------|--------|-----------|
| **chrome + body** | `nri-people-hub`, `nri-master-tools`, `nri-scenario-hub`, `nri-city-map`, `neon-chat` | Subtabs/head flush к рамке; scroll в `*__body` или feed |
| **scroll-all** | wallet, inventory, transport, cyber, vault, ICE hub, dossier, notes, boot | `padding: 12px`, один vertical scroll |

Новый канал **MUST** попасть в один из layout-ов в CSS stage (не свой `max-width`/внешний border).

## Scope v1 (пилот A–C + D)

| Фаза | Что |
|------|-----|
| A | Spec + CSS tokens (`--nri-*`) |
| B | Lobby chrome: tabs + members strip |
| C | Игрок: Мой чарник + полевые досье (field-PDA) |
| D | Инвентарь / кошелёк / чат: touch + single-column densify |

Out of scope v1: полный icon dictionary, перерисовка карты, новый шрифт-файл (системный stack ок).

## Visual identity (фаза E — **Dead Channel Ink**)

Канон оболочки — **литература + комикс**, не game-HUD / candy neon.

| Источник | Что берём |
|----------|-----------|
| Gibson *Neuromancer* | «sky the color of television tuned to a dead channel» → cold phosphor ink, не candy cyan; black ICE; mono console |
| *Akira* / manga panels | толстые чёрные рамки, gutters, caption-stamps, высокий ink-contrast |
| *Ghost in the Shell* (manga / Oshii) | clinical teal-grey, schematic restraint, без лишнего glow |
| *Transmetropolitan* / *2000 AD* | hazard amber, newsprint density, жирные чёрные rules |
| *Blame!* | megastructure greys, oppressive empty space |
| [moodboard-20](./moodboard-20.html) | diegetic метафоры стола (дек / ICE / мастер·поле) как вторичный слой |

**Locked look — Dead Channel Ink:**

- Surfaces: ink void `#050508` → panel `#0c1014` (не purple gunmetal).
- Accent: cold phosphor `#3dffa8` (status) · hazard `#e8b84a` (warn) · hot `#ff2a6d` только alert / active underline.
- Borders: **ink-weight** (чёрный gutter + тонкая phosphor line), не neon glow box-shadow.
- Stage = comic **panel** (двойная рамка, corner ticks как crop marks).
- Glow restraint: почти ноль; glow только focus / critical.
- Шрифты: **Rajdhani/Outfit** UI (manga chapter weight) · **JetBrains Mono** data (deck console).

### Form language — skins

Моки: [moodboard-forms.html](./moodboard-forms.html) · [moodboard-20.html](./moodboard-20.html)

Переключатель **в меню `@user`** (portal поверх UI, z-index высокий): `<select>` + chips (`data-nri-skin`, `localStorage` `neon_nri_lobby_skin`).

| Группа | Skins |
|--------|--------|
| **form** | `terminal` (default) · `deck` · `manga` |
| **mood20** | `jack`…`wrist` — все 20 метафор (01–20) |

**MUST:** stage hard-lock общий; touch tabs ≥ 44px; палитры mood20 через `--nri-*` + лёгкий chrome.

### Host DM popup

«Кому» в чате стола → `requestOpenDm(..., { popup: true })` → `NriDmCallPopup` (без переключения вкладки ЛИЧКА). Тот же попап, что психоз-звонок.

## Refs

010 UI comfort · Gibson / Akira / GiTS / Transmet · Into the Breach clarity · moodboard-20.
