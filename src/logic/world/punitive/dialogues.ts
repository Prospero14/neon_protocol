import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

/**
 * Punitive Squad interactions for v0.095 'Faction Warfare'
 * Triggered at reputation < -50 or high-heat events.
 */
export const punitive_dialogues: Record<string, DialogueTree> = {
  punitive_squad: new DialogueBuilder('punitive_squad').withDistrict('punitive')
    .withGreetings({
      neutral: ['intro'],
      hostile: ['intro', 'intro_v2'],
      stressed: ['intro_stressed']
    })
    .addNode('intro', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[WARNING] КРИТИЧЕСКАЯ ДЕВИАЦИЯ. РЕПУТАЦИЯ НИЖЕ ПРЕДЕЛА GIGABANK. ПРИКАЗ 77: НЕМЕДЛЕННОЕ ОБНУЛЕНИЕ ПРИСУТСТВИЯ.', [
      { text: 'Я готов к бою, консервные банки!', nextId: 'combat_start' },
      { text: 'Активировать экстренный обход (Technical).', nextId: 'tech_override', requireMinLevel: 10 },
      { text: 'Platinum-приоритет (Social: GigaBank 80).', nextId: 'bribe_check', requireReputation: { factionId: 'GIGABANK', minPoints: 80 } },
      { text: 'Взломать протокол (2000 Bits).', nextId: 'bribe_check', cost: 2000 },
      { text: 'Бежать!', nextId: 'flee_attempt' }
    ])
    .addNode('intro_v2', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[SCANNING...] ОБНАРУЖЕНА ЦЕЛЬ В СПИСКЕ "НЕГАТИВНЫХ АКТИВОВ". ВАШ КРЕДИТНЫЙ РЕЙТИНГ — НОЛЬ. ЗАПУСК УТИЛИЗАЦИИ.', [
      { text: 'Вступаю в бой.', nextId: 'combat_start' },
      { text: '[ Уйди ]', nextId: 'flee_attempt' }
    ])
    .addNode('intro_stressed', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[DETECTED] ВЫСОКИЙ УРОВЕНЬ ШУМА ЦЕЛИ. ОБЛЕГЧАЕМ ПРОЦЕСС ОБНУЛЕНИЯ. ПРИГОТОВЬТЕСЬ К ПЕРЕЗАГРУЗКЕ.', [
      { text: 'Не дождетесь.', nextId: 'combat_start' }
    ])
    .addNode('combat_start', 'СИСТЕМА_ПОДАВЛЕНИЯ', 'ИНТЕРФЕЙС БОЯ АКТИВИРОВАН. ПОРЯДОК ОБНУЛЕНИЯ: LS -> AUTH -> SUDO_FIX -> WASH -> RM. УДАЧИ В ПУСТОТЕ, ИНФОРМАЦИОННЫЙ МУСОР. (Начать бой)', [
      { text: '[ ВСТУПИТЬ В БОЙ ]', nextId: 'LEAVE', awardQuestId: 'q_punitive_squad_combat' }
    ])
    .addNode('tech_override', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[ERROR] АДМИНИСТРАТИВНЫЙ ИНЪЕКТОР... ПРОВЕРКА COMMANDER-LEVEL... [OK] РЕЖИМ ОЖИДАНИЯ ВКЛЮЧЕН. У ВАС 60 СЕКУНД.', [
      { text: 'Уйти.', nextId: 'LEAVE', effect: 'RESET_STRESS' }
    ])
    .addNode('bribe_check', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[OK] ВАША ЛОЯЛЬНОСТЬ (ИЛИ БАЛАНС) ВЕРИФИЦИРОВАНЫ. СИГНАТУРА МАСКИРУЕТСЯ В РЕЕСТРЕ "СВОИХ". УХОДИТЕ.', [
      { text: 'Уйти по-тихому.', nextId: 'LEAVE', effect: 'RESET_STRESS' }
    ])
    .addNode('flee_attempt', 'СИСТЕМА_ПОДАВЛЕНИЯ', '[ERROR] ПОПЫТКА ПОБЕГА ПРЕСЕЧЕНА ПЕРЕХВАТЧИКАМИ. ПРИКАЗ 77 В СИЛЕ.', [
      { text: 'Черт...', nextId: 'combat_start' }
    ])
    .build(),
};
