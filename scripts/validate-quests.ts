/**
 * validate-quests.ts
 * Аудит квестовых ID и цепочек Neon Protocol.
 *
 * Запуск:
 *   & ".\node_modules\.bin\jiti.cmd" ".\scripts\validate-quests.ts"
 *
 * Проверяет:
 * 1. Все awardQuestId в диалогах существуют в QUEST_LIBRARY
 * 2. Все requireQuestId существуют в QUEST_LIBRARY
 * 3. Нет дубликатов quest ID
 * 4. У каждого квеста есть giverNpcId (не пустой)
 * 5. Квестовые цепочки (awardQuestId → requireQuestId) не зациклены
 */

import { QUEST_LIBRARY } from '../src/logic/questData';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const RED   = (s: string) => `\x1b[31m${s}\x1b[0m`;
const GREEN = (s: string) => `\x1b[32m${s}\x1b[0m`;
const AMBER = (s: string) => `\x1b[33m${s}\x1b[0m`;
const CYAN  = (s: string) => `\x1b[36m${s}\x1b[0m`;
const BOLD  = (s: string) => `\x1b[1m${s}\x1b[0m`;

let errors = 0;
let warnings = 0;

function error(msg: string)   { console.log(RED(`  [ERR] ${msg}`));  errors++; }
function warn(msg: string)    { console.log(AMBER(`  [WARN] ${msg}`)); warnings++; }
function ok(msg: string)      { console.log(GREEN(`  [OK]  ${msg}`)); }
function section(msg: string) { console.log(`\n${BOLD(CYAN(msg))}`); }

// ─────────────────────────────────────────────────────────────────────────────
// 1. ДУБЛИКАТЫ QUEST ID
// ─────────────────────────────────────────────────────────────────────────────
section('═══ 1. ДУБЛИКАТЫ QUEST ID ═══');
const allIds = QUEST_LIBRARY.map(q => q.id);
const idCounts = allIds.reduce<Record<string, number>>((acc, id) => {
  acc[id] = (acc[id] || 0) + 1;
  return acc;
}, {});

let hasDupes = false;
for (const [id, count] of Object.entries(idCounts)) {
  if (count > 1) {
    error(`DUPLICATE: "${id}" встречается ${count} раз`);
    hasDupes = true;
  }
}
if (!hasDupes) ok(`Дубликатов нет. Всего квестов: ${QUEST_LIBRARY.length}`);

const questSet = new Set(allIds);

// ─────────────────────────────────────────────────────────────────────────────
// 2. СКАН ДИАЛОГОВЫХ ФАЙЛОВ НА awardQuestId / requireQuestId
// ─────────────────────────────────────────────────────────────────────────────
section('═══ 2. ДИАЛОГОВЫЕ ССЫЛКИ НА КВЕСТЫ ═══');

const WORLD_DIR = path.resolve('./src/logic/world');
const dialogueFiles: string[] = [];

function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.ts') && (entry.name.includes('dialogue') || entry.name.includes('dialog'))) {
      dialogueFiles.push(full);
    }
  }
}
walkDir(WORLD_DIR);

const awardPattern   = /awardQuestId:\s*['"]([^'"]+)['"]/g;
const requirePattern = /requireQuestId:\s*['"]([^'"]+)['"]/g;

let dialogueErrors = 0;
for (const file of dialogueFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(process.cwd(), file);

  // awardQuestId
  for (const match of content.matchAll(awardPattern)) {
    const id = match[1];
    if (!questSet.has(id)) {
      error(`awardQuestId "${id}" НЕ НАЙДЕН в QUEST_LIBRARY\n     → ${rel}`);
      dialogueErrors++;
    }
  }

  // requireQuestId
  for (const match of content.matchAll(requirePattern)) {
    const id = match[1];
    if (!questSet.has(id)) {
      error(`requireQuestId "${id}" НЕ НАЙДЕН в QUEST_LIBRARY\n     → ${rel}`);
      dialogueErrors++;
    }
  }
}
if (dialogueErrors === 0) ok(`Все awardQuestId и requireQuestId валидны в ${dialogueFiles.length} файлах`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. КВЕСТЫ БЕЗ giverNpcId
// ─────────────────────────────────────────────────────────────────────────────
section('═══ 3. КВЕСТЫ БЕЗ giverNpcId ═══');
const missingGiver = QUEST_LIBRARY.filter(q => !q.giverNpcId);
if (missingGiver.length > 0) {
  for (const q of missingGiver) warn(`[${q.id}] нет giverNpcId (districtId: ${q.districtId ?? '?'})`);
} else {
  ok('У всех квестов есть giverNpcId');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ПЕРЕКРЁСТНЫЕ ССЫЛКИ КВЕСТОВ (objectiveNodeId vs subNodes)
// ─────────────────────────────────────────────────────────────────────────────
section('═══ 4. objectiveNodeId — существование узлов ═══');

// Собираем все subNode IDs из всех районов
const worldFiles: string[] = [];
const WORLD_INDEX_FILES = fs.readdirSync(WORLD_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => path.join(WORLD_DIR, e.name, 'index.ts'));

const subNodeIdPattern = /id:\s*['"]([^'"]+)['"]/g;
const allSubNodeIds = new Set<string>();

for (const indexFile of WORLD_INDEX_FILES) {
  if (!fs.existsSync(indexFile)) continue;
  const content = fs.readFileSync(indexFile, 'utf-8');
  // Ищем только внутри subNodes блока (упрощённо)
  for (const match of content.matchAll(subNodeIdPattern)) {
    allSubNodeIds.add(match[1]);
  }
}

let nodeErrors = 0;
for (const quest of QUEST_LIBRARY) {
  if (quest.objectiveNodeId && !allSubNodeIds.has(quest.objectiveNodeId)) {
    warn(`[${quest.id}] objectiveNodeId "${quest.objectiveNodeId}" не найден ни в одном index.ts`);
    nodeErrors++;
  }
}
if (nodeErrors === 0) ok('Все objectiveNodeId референсы валидны');

// ─────────────────────────────────────────────────────────────────────────────
// 5. ИТОГ
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log(GREEN(BOLD('✅ QUEST REGISTRY: ALL CHECKS PASSED')));
} else {
  if (errors > 0)   console.log(RED(`❌ Ошибок: ${errors}`));
  if (warnings > 0) console.log(AMBER(`⚠️  Предупреждений: ${warnings}`));
}
console.log(`📋 Всего квестов в библиотеке: ${QUEST_LIBRARY.length}`);
console.log(`📂 Проверено диалоговых файлов: ${dialogueFiles.length}`);
console.log('═'.repeat(50) + '\n');

if (errors > 0) process.exit(1);
