# Spec: NRI tile art

## Overview

Спрайты построек для district grid: на карте — orthographic **top** (вращение 90°), в попапе — **¾ iso**. Дороги procedural. Холодная киберпанк-палитра.

Канон вкуса и статуса: [../005-nri-district-map/editor-wishes.md](../005-nri-district-map/editor-wishes.md).  
Пайплайн: [plan.md](./plan.md). Target look: [refs/nri-district-target-look.jpg](./refs/nri-district-target-look.jpg).

## Requirements

### MUST

1. Один угол камеры и масштаб на всю галерею (iso cutout на прозрачном фоне).
2. Здание без собственной «улицы» / асфальта / горизонта в PNG — сцена собирается из клеток.
3. Жильё = панельки / массiv, не «домик на поляне».
4. Клетка = одна крыша + узкое кольцо пространства; sidewalk/двор procedural.
5. Неон/вывески светят снизу (уровень улицы), где применимо.
6. После генерации — knockout alpha (`scripts/knockout-tile-matte.mjs`) и запись в `district-building-gallery.json`.

### MUST NOT

1. Полноценная уличная диорама в спрайте здания.
2. Тёплая «курортная» палитра.
3. Смесь плоских иконок и чужих камер на одной карте.
4. Watermark / чужой бренд с mood-рефов.

## Related

- Plan: [plan.md](./plan.md)
- Prompts: [prompts.md](./prompts.md)
- Grid: [../005-nri-district-map/spec.md](../005-nri-district-map/spec.md)
