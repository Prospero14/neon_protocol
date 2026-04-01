/**
 * Система профессий (Классов) в Neon Protocol.
 */

export type ProfessionCategory = 'HARD' | 'SOFT';
export type ProfessionGrade = 'Junior' | 'Middle' | 'Senior';

export interface Profession {
  id: string;
  name: string;
  category: ProfessionCategory;
  path: 'Management' | 'Analysis' | 'DevOps' | 'QA' | 'Development' | 'Infrastructure' | 'Architecture';
  specialization: string;
  description: string;
  grade: ProfessionGrade;
  isUnlocked: boolean;
}

export const PROFESSIONS: Profession[] = [
  // --- STARTING CLASS ---
  {
    id: 'trainee',
    name: 'Unemployed Trainee / Безработный Стажёр',
    category: 'SOFT',
    path: 'Analysis',
    specialization: 'Survival 101',
    description: 'У тебя нет класса. Ты всего лишь шум в системе. Твоя цель — выжить и заработать на первую лицензию.',
    grade: 'Junior',
    isUnlocked: true
  },

  // --- LANGUAGES (DEVELOPMENT) ---
  {
    id: 'java_jun',
    name: 'Java Junior Developer',
    category: 'HARD',
    path: 'Development',
    specialization: 'Back-end Foundations',
    description: 'Мастер объектно-ориентированной стабильности. Твой код надежен как старый сервер.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'kotlin_jun',
    name: 'Kotlin Developer',
    category: 'HARD',
    path: 'Development',
    specialization: 'Mobile / Android',
    description: 'Современный лаконичный подход. Меньше кода — меньше багов. Идеально для мобильных терминалов.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'python_jun',
    name: 'Python Developer',
    category: 'HARD',
    path: 'Development',
    specialization: 'Automation / AI',
    description: 'Скорость написания превыше всего. Идеально для быстрой автоматизации и нейросетей.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'js_jun',
    name: 'JavaScript Developer',
    category: 'HARD',
    path: 'Development',
    specialization: 'UI/UX / Web',
    description: 'Творец визуальной реальности. Твой код оживляет интерфейсы Октября.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'go_jun',
    name: 'Go Developer',
    category: 'HARD',
    path: 'Development',
    specialization: 'Cloud / Highload',
    description: 'Мастер параллелизма. Твой код летает по каналам данных быстрее всех.',
    grade: 'Junior',
    isUnlocked: false
  },

  // --- ROLES (INFRA & MANAGEMENT) ---
  {
    id: 'devops_jun',
    name: 'DevOps Engineer',
    category: 'HARD',
    path: 'DevOps',
    specialization: 'CI/CD Pipelines',
    description: 'Строитель дорог для кода. Ты автоматизируешь хаос и превращаешь его в релизы.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'sysadmin_jun',
    name: 'System Administrator',
    category: 'HARD',
    path: 'Infrastructure',
    specialization: 'Server/Net Hardware',
    description: 'Хранитель физического уровня. Ты знаешь, какой кабель нужно дернуть, чтобы всё заработало.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'architect_mid',
    name: 'System Architect',
    category: 'HARD',
    path: 'Architecture',
    specialization: 'Global Topology',
    description: 'Визионер структуры. Ты не пишешь код, ты рисуешь судьбу систем.',
    grade: 'Middle',
    isUnlocked: false
  },
  {
    id: 'pm_jun',
    name: 'Project Manager',
    category: 'SOFT',
    path: 'Management',
    specialization: 'Agile / Chaos Control',
    description: 'Человек-оркестр. Ты заставляешь код писаться вовремя, даже если всё горит.',
    grade: 'Junior',
    isUnlocked: false
  },
  {
    id: 'qa_heavy_jun',
    name: 'QA Performance Tester',
    category: 'HARD',
    path: 'QA',
    specialization: 'Load / Stress',
    description: 'Мастер по ломанию надежд. Ты находишь баги там, где их "точно нет".',
    grade: 'Junior',
    isUnlocked: false
  }
];

export const getProfessionById = (id: string) => PROFESSIONS.find(p => p.id === id);
