/**
 * Тематика «недели» коопа (ротация по игровым суткам). Не путать с игровой докой колоды.
 */

export type CoopWeeklyTheme = {
  id: string;
  /** Короткий заголовок для хаба */
  title: string;
  /** 1–2 предложения + отсылка к лору */
  lore: string;
  /** Подзаголовок механики */
  accent?: string;
};

/** Порядок смены тем — по одной «неделе» на 7 игровых дней. */
export const COOP_WEEKLY_THEMES: CoopWeeklyTheme[] = [
  {
    id: 'banking_gigabank',
    title: 'Неделя: банкинг',
    lore:
      'Собираете финтех, который может бросить вызов ГигаБанку: платежи, лимиты, репутация в сети Октоберлайн. Чем меньше шума на шине — тем выше доверие инвесторов.',
    accent: 'Фокус: деньги, лимиты, пустые краевые случаи.',
  },
  {
    id: 'music_streams',
    title: 'Неделя: музыкальный сервис',
    lore:
      'Плейлисты, роялти и задержки стрима — ваш код держит сцену, пока лейблы спорят о долях.',
    accent: 'Фокус: очереди, кэш, UX без лагов.',
  },
  {
    id: 'messenger_mesh',
    title: 'Неделя: мессенджер',
    lore:
      'Шифрование, доставка и антиспам: вы строите канал, который переживёт и фейки, и пик нагрузки.',
    accent: 'Фокус: состояние, дедуп, доставка «хотя бы раз».',
  },
  {
    id: 'logistics_lastmile',
    title: 'Неделя: логистика «последней милицы»',
    lore:
      'Маршруты курьеров и склады-автоматы: опоздание на одном узле ломает всю сетку.',
    accent: 'Фокус: графы, окна времени, откаты.',
  },
];

export function coopWeekIndexFromWorldDay(worldDay: number): number {
  const w = Math.max(1, Math.floor(worldDay));
  return Math.floor((w - 1) / 7) % COOP_WEEKLY_THEMES.length;
}

export function coopThemeForWorldDay(worldDay: number): CoopWeeklyTheme {
  return COOP_WEEKLY_THEMES[coopWeekIndexFromWorldDay(worldDay)];
}
