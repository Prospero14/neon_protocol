/**
 * Темы задач в духе площадок вроде Codewars / LeetCode (категории и формулировки обобщены,
 * без копирования условий). Используются для подсказок, лора и будущих квестов.
 */

import type { DevLanguageStack } from './deckCatalog';

export type TaskTheme = {
  id: string;
  titleRu: string;
  familyEn: string;
  hint: string;
};

/** По каждому языковому стеку — типичные семейства кат (строки, коллекции, DP, и т.д.). */
export const TASK_THEMES_BY_LANGUAGE: Record<DevLanguageStack, TaskTheme[]> = {
  java: [
    { id: 'java_strings', titleRu: 'Строки и символы', familyEn: 'String manipulation (8–7 kyu style)', hint: 'Разворот, палиндромы, подсчёт вхождений, split/join.' },
    { id: 'java_collections', titleRu: 'Коллекции и Stream', familyEn: 'List/Map/Set + Stream API', hint: 'Фильтрация, группировка, reduce, Optional.' },
    { id: 'java_oop', titleRu: 'Классы и интерфейсы', familyEn: 'OOP basics', hint: 'Наследование, полиморфизм, equals/hashCode.' },
    { id: 'java_concurrency', titleRu: 'Потоки и синхронизация', familyEn: 'Concurrency intro', hint: 'Executor, volatile, блокировки (упрощённо).' },
    { id: 'java_springish', titleRu: 'Сервис и данные', familyEn: 'Layered app (REST + repo)', hint: 'Контроллер → сервис → хранилище; типичные CRUD-сценарии.' },
  ],
  kotlin: [
    { id: 'kt_null', titleRu: 'Null-safety', familyEn: 'Nullable types', hint: 'Elvis, safe calls, sealed результаты.' },
    { id: 'kt_stdlib', titleRu: 'Стандартная библиотека', familyEn: 'Collections & scope functions', hint: 'let/apply/run, immutable коллекции.' },
    { id: 'kt_coroutines', titleRu: 'Асинхронность', familyEn: 'Coroutines mindset', hint: 'suspend, async flows на концептуальном уровне.' },
    { id: 'kt_interop', titleRu: 'Interop с Java', familyEn: 'Java interop', hint: 'JvmName, платформенные типы, смешанные модули.' },
  ],
  python: [
    { id: 'py_strings', titleRu: 'Текст и парсинг', familyEn: 'String & regex basics', hint: 'Срезы, split, простые шаблоны.' },
    { id: 'py_data', titleRu: 'Структуры данных', familyEn: 'list/dict/set', hint: 'Частоты, множества, сортировка ключей.' },
    { id: 'py_scripting', titleRu: 'Скрипты и CLI', familyEn: 'Automation kata', hint: 'Аргументы, файлы, пайплайны обработки логов.' },
    { id: 'py_webish', titleRu: 'Веб и HTTP', familyEn: 'Request/response exercises', hint: 'JSON, статусы, простые API-заглушки.' },
  ],
  go: [
    { id: 'go_slices', titleRu: 'Срезы и строки', familyEn: 'Slices & strings', hint: 'append, copy, runes vs bytes.' },
    { id: 'go_maps', titleRu: 'Карты и структуры', familyEn: 'Structs & maps', hint: 'Агрегации, set через map[T]struct{}.' },
    { id: 'go_net', titleRu: 'Сеть', familyEn: 'HTTP client/server intro', hint: 'handlers, context, таймауты.' },
    { id: 'go_concurrent', titleRu: 'Горутины', familyEn: 'Concurrency patterns', hint: 'channels, select, worker pool на уровне идей.' },
  ],
};

/** Дополнительные темы по ролям (не язык). Admin включает бывший DevOps-фокус (сеть, CI, наблюдаемость). */
export const TASK_THEMES_BY_COOP_ROLE = {
  developer: [] as TaskTheme[],
  qa: [
    { id: 'qa_boundary', titleRu: 'Граничные значения', familyEn: 'Boundary testing', hint: 'Пустые входы, максимумы Unicode, таймзоны.' },
    { id: 'qa_regress', titleRu: 'Регрессия', familyEn: 'Regression mindset', hint: 'Чек-листы, приоритизация рисков.' },
    { id: 'qa_api', titleRu: 'Контракт API', familyEn: 'API testing', hint: 'Схемы, коды ответов, идемпотентность.' },
  ] as TaskTheme[],
  pm: [
    { id: 'pm_scope', titleRu: 'Объём и приоритет', familyEn: 'Scope & backlog', hint: 'MVP, MoSCoW, зависимости между задачами.' },
    { id: 'pm_risk', titleRu: 'Риски', familyEn: 'Risk register', hint: 'Вероятность × влияние, планы смягчения.' },
    { id: 'pm_comms', titleRu: 'Коммуникация', familyEn: 'Stakeholder comms', hint: 'Статусы, эскалации, документация решений.' },
  ] as TaskTheme[],
  admin: [
    { id: 'adm_perm', titleRu: 'Права и доступ', familyEn: 'Permissions & ACL', hint: 'chmod/sudo-аналоги, принцип наименьших привилегий.' },
    { id: 'adm_sec', titleRu: 'Безопасность', familyEn: 'Hardening', hint: 'Сегментация сети, карантин, аудит.' },
    { id: 'adm_backup', titleRu: 'Резервирование', familyEn: 'Backup/restore', hint: 'RPO/RTO, проверка восстановления.' },
    { id: 'sre_ci', titleRu: 'CI/CD сценарии', familyEn: 'Pipeline tasks', hint: 'Сборка, тест, деплой, откат.' },
    { id: 'sre_obs', titleRu: 'Наблюдаемость', familyEn: 'Logs & metrics', hint: 'Корреляция логов, алерты, дашборды.' },
    { id: 'sre_net', titleRu: 'Сеть, TLS, балансировка', familyEn: 'Networking drills', hint: 'Прокси, сертификаты, health-check.' },
  ] as TaskTheme[],
};
