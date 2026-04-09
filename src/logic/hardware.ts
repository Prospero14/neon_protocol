import type { CardLibTag } from './combatCards';

export type HardwareType = 'CPU' | 'RAM' | 'COOLING';

export interface DeckHardware {
  id: string;
  name: string;
  type: HardwareType;
  baseCores?: number;
  baseRamMb?: number;
  bonusCores?: number;
  bonusRamMb?: number;
  description: string;
  cost: number;
}

export interface ImplantModule {
  id: string;
  name: string;
  libId?: CardLibTag;
  description: string;
  cost: number;
  adaptationPeriod: number; // Обычно 10
}

export const HARDWARE_CATALOG: DeckHardware[] = [
  // --- CPUs ---
  { id: 'cpu_celeron_scrap', name: 'Celeron Scrap-Bin', type: 'CPU', baseCores: 1.25, description: 'Снято с терминалов МЦК. 1.25 ядра, дёшево.', cost: 160 },
  { id: 'cpu_intel_i5', name: 'Intel Core i5 (Refurbished)', type: 'CPU', baseCores: 1.5, description: 'Старое, но надежное железо. 1.5 ядра.', cost: 300 },
  { id: 'cpu_ryzen_9', name: 'Ryzen 9 Neural Edition', type: 'CPU', baseCores: 2.5, bonusCores: 0.15, description: 'Многопоточность + небольшой OC. ~2.65 эффективных ядра.', cost: 850 },
  { id: 'cpu_threadrip_lite', name: 'ThreadRip Lite OC', type: 'CPU', baseCores: 3.0, bonusCores: 0.2, description: 'Станция для Middle: 3.2 ядра в пике.', cost: 1350 },
  { id: 'cpu_quant_photon', name: 'Photon-Quant Matrix', type: 'CPU', baseCores: 4.0, description: 'Экспериментальный квантовый процессор. 4.0 ядра.', cost: 2500 },

  // --- RAM ---
  { id: 'ram_ddr4_4g', name: 'DDR4 4GB Salvaged', type: 'RAM', baseRamMb: 512, description: 'Минимум для скриптов. 512 MiB на шине деки.', cost: 120 },
  { id: 'ram_k-ston_8', name: 'Kingston 8GB DDR4', type: 'RAM', baseRamMb: 1024, description: 'Стандартный объем для Junior-задач. 1GB.', cost: 200 },
  { id: 'ram_crucial_16', name: 'Crucial 16GB Tactical', type: 'RAM', baseRamMb: 2048, bonusRamMb: 256, description: '2GB + запас на кэш сборки.', cost: 500 },
  { id: 'ram_neural_bank', name: 'Neural-Bank X2', type: 'RAM', baseRamMb: 8192, description: 'Огромный объем для работы с AI-моделями (8GB).', cost: 1800 },
];

export const IMPLANT_CATALOG: ImplantModule[] = [
  { id: 'imp_collections', name: 'Collections Optimizer', libId: 'collections', description: 'Обработка структур данных прямо в мозжечке.', cost: 400, adaptationPeriod: 10 },
  { id: 'imp_streams', name: 'Stream-Processor v1', libId: 'streams', description: 'Функциональный пайплайн во фронтальной коре.', cost: 700, adaptationPeriod: 10 },
  { id: 'imp_lombok', name: 'Lombok-Auto-Module', libId: 'scripting', description: 'Автоматическая генерация boilerplate-кода.', cost: 600, adaptationPeriod: 10 },
  { id: 'imp_spring', name: 'Spring-Ecosystem-Link', libId: 'spring', description: 'Полная интеграция с Enterprise фреймворками.', cost: 1200, adaptationPeriod: 10 },
  { id: 'imp_network_stack', name: 'Socket Layer Graft', libId: 'network', description: 'Низкоуровневые вызовы без задержки осознания.', cost: 550, adaptationPeriod: 10 },
  { id: 'imp_concurrency_shard', name: 'Fork-Join Shard', libId: 'concurrency', description: 'Параллельные ветки мышления без гонок.', cost: 950, adaptationPeriod: 10 },
  { id: 'imp_script_bridge', name: 'CLI Reflex Bridge', libId: 'scripting', description: 'Ускоряет скриптовые карты в полевых задачах.', cost: 480, adaptationPeriod: 10 },
];
