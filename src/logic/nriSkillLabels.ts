/** Русские подписи навыков Carbon 2185 (канонические id — английские имена в save). */

const SKILL_LABELS_RU: Record<string, string> = {
  Acrobatics: 'Акробатика',
  Athletics: 'Атлетика',
  Bureaucracy: 'Бюрократия',
  Computing: 'Информатика',
  Deception: 'Обман',
  Engineering: 'Инженерия',
  Gambling: 'Азартные игры',
  Hacking: 'Взлом',
  History: 'История',
  Intimidation: 'Запугивание',
  Investigation: 'Расследование',
  Mechanics: 'Механика',
  Medicine: 'Медицина',
  Navigation: 'Навигация',
  Perception: 'Восприятие',
  Performance: 'Выступление',
  Persuasion: 'Убеждение',
  Presence: 'Присутствие',
  Religion: 'Религия',
  Robotics: 'Робототехника',
  'Sense Motive': 'Чтение мотивов',
  'Sleight of Hand': 'Ловкость рук',
  Stealth: 'Скрытность',
  Streetwise: 'Уличная смекалка',
  Tracking: 'Выслеживание',
  'Vehicles (Aircraft)': 'Транспорт (авиа)',
  'Vehicles (Land)': 'Транспорт (наземный)',
};

const ABILITY_LABELS_RU: Record<string, string> = {
  STR: 'СИЛ',
  DEX: 'ЛОВ',
  CON: 'ТЕЛ',
  INT: 'ИНТ',
  TEC: 'ТЕХ',
  PEO: 'ХАР',
};

export function skillLabelRu(skillName: string): string {
  return SKILL_LABELS_RU[skillName] ?? skillName;
}

export function abilityLabelRu(ability: string): string {
  return ABILITY_LABELS_RU[ability] ?? ability;
}
