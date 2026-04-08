/**
 * Как оппонент увязывается с конвейером: инфра → код по ТЗ → стабилизация → деплой.
 * В киберпанке маска оппонента может быть любой (ИИ, дев, админ, ICE, боты сети) — механика одна:
 * давление на поставку, а не «дуэль двух репозиториев».
 */

import type { BugEnemy } from './combatEnemies';
import type { SkillMode } from './skillMode';

export interface OpponentPipelineNarrative {
  headline: string;
  /** Кто в лоре может выступать противником в неоновом городе. */
  spectrum: string;
  body: string;
  /** Конкретная сессия: имя/тип текущего процесса. */
  encounter: string;
}

const CYBERPUNK_OPPONENT_SPECTRUM =
  'В неоновой Москве оппонентом может быть кто угодно с той стороны терминала: автономный ИИ и синтеты, ' +
  'чужие разработчики и аутсорс-команды, корпоративные сисадмины и SOC, ICE и политики доступа, ' +
  'дикие демоны сети и скиммеры — одна боевая модель описывает их общее давление на твой релиз.';

function encounterLine(enemy: BugEnemy | null | undefined): string {
  if (!enemy) {
    return 'Текущая сессия: случайный агрессор стека — угроза, дедлайн и стабильность растут по ходам.';
  }
  const title = enemy.name;
  switch (enemy.visualType) {
    case 'DEVELOPER':
      return `Текущая сессия: «${title}» — живой или полуавтоматический контур: процедуры, сканы, тревоги, жёсткий такт (часто человек за консолью или корп-оператор).`;
    case 'ICE':
      return `Текущая сессия: «${title}» — защитный/аудиторский слой (ICE, compliance, DPI): блокировки, инъекции статусов, баги на шине после проверки.`;
    case 'AI':
    default:
      return `Текущая сессия: «${title}» — безликая автоматика: боты, трассы, демоны, нейросетевой заказчик — угроза без обязательной «личности».`;
  }
}

/** Режим скриптера: быстрый воркфлоу и периметр. */
function narrativeScriptKiddie(enemy: BugEnemy | null | undefined): OpponentPipelineNarrative {
  const visual = enemy?.visualType;
  let flavor =
    'Под капотом — шум среды: мусор в руке, лишняя нагрузка, случайные сбои; не важно, ИИ это или скрипт охраны.';
  if (visual === 'DEVELOPER') {
    flavor =
      'Периметр «живой»: хост, смена админов, регламенты — тот же стресс и таймер, что и у настоящего инцидента.';
  } else if (visual === 'ICE') {
    flavor =
      'ICE и фильтры — как у корпорации: обходишь контурами и реакциями, пока не уложишься в окно.';
  }

  return {
    headline: 'ОППОНЕНТ: ЛЮБАЯ УГРОЗА СТЕКА',
    spectrum: CYBERPUNK_OPPONENT_SPECTRUM,
    body:
      'Воркфлоу скриптера: минимальная инфра под задачу → сценарии по ТЗ на шине → «разборки» (трассы, сканы, мусор) → выход в условный релиз. ' +
      'Твой код — то, что должно дойти до выкладки; ходы оппонента — рост Threat, BUG_ERROR, стресс. ' +
      flavor,
    encounter: encounterLine(enemy),
  };
}

/** Режим разработки: полноценный SDLC и система качества. */
function narrativeDeveloper(enemy: BugEnemy | null | undefined): OpponentPipelineNarrative {
  const visual = enemy?.visualType;
  let flavor =
    'Под маской — CI, security scan, легаси, инциденты: будь то ИИ-аудитор, чужой тимлид или ночной дежурный.';
  if (visual === 'DEVELOPER') {
    flavor =
      'Здесь уместны люди процесса: релиз-менеджер, дежурный, внешний подрядчик — те же часы и эскалации.';
  } else if (visual === 'ICE') {
    flavor =
      'Корпоративный контур: политики, аудит, «дыры» после скана — закрываются тестами, патчами и софтом на стабилизации.';
  }

  return {
    headline: 'ОППОНЕНТ: СИСТЕМА, ЛЮДИ И МАШИНЫ',
    spectrum: CYBERPUNK_OPPONENT_SPECTRUM,
    body:
      'Конвейер разработки: ресурсы → реализация по ТЗ → стабилизация (тесты, патчи, софт) → деплой. ' +
      'Оппонент не обязан быть «вторым программистом»; это может быть ИИ, конкурирующий дев, админ или ICE — ' +
      'всё это сводится к давлению на поставку. Threat и BUG_ERROR — цена пробелов перед выкладкой. ' +
      flavor,
    encounter: encounterLine(enemy),
  };
}

export function getOpponentPipelineNarrative(
  skillMode: SkillMode,
  enemy: BugEnemy | null | undefined
): OpponentPipelineNarrative {
  return skillMode === 'script-kiddie' ? narrativeScriptKiddie(enemy) : narrativeDeveloper(enemy);
}
