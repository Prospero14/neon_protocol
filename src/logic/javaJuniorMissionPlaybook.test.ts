import { describe, expect, it } from 'vitest';
import { JAVA_REFERENCE } from './referenceData';
import { getCardById } from './combatCards';
import { DEVELOPER_STACK_BROWSE_IDS } from './decks/deckCatalog';
import { COOP_ADMIN_CATALOG_IDS, COOP_QA_CATALOG_IDS } from './sessionMode';

/** См. design/coop-missions/java_junior_card_playbooks.md — пути A/B для BANK-JU-001. */
const PATH_A_IMPERATIVE = [
  'syntax_package',
  'syntax_class_decl',
  'syntax_main_method',
  'syntax_list_init',
  'syntax_if',
  'fn_sysout_print',
  'syntax_foreach',
  'fn_sysout_print',
] as const;

const PATH_B_STREAM = [
  'syntax_package',
  'syntax_class_decl',
  'syntax_main_method',
  'syntax_list_init',
  'mid_stream_init',
  'mid_stream_map',
  'mid_stream_collect',
  'fn_sysout_print',
] as const;

const QA_SUGGESTED = [
  'react_unit_test',
  'react_boundary_case',
  'react_integration_test',
  'def_validator',
  'react_refactoring',
  'def_smoke_suite',
] as const;

function expectInJavaCatalog(ids: readonly string[]) {
  const cat = DEVELOPER_STACK_BROWSE_IDS.java;
  for (const id of ids) {
    expect(cat.has(id), `${id} must be in DEVELOPER_STACK_BROWSE_IDS.java`).toBe(true);
    expect(getCardById(id), `card ${id} must exist`).toBeDefined();
  }
}

describe('java junior mission playbook (BANK-JU-001)', () => {
  it('path A and B dev cards are in Java coop browse catalog', () => {
    expectInJavaCatalog(PATH_A_IMPERATIVE);
    expectInJavaCatalog(PATH_B_STREAM);
  });

  it('each dev playbook card has JAVA_REFERENCE documentation', () => {
    const uniq = new Set<string>([...PATH_A_IMPERATIVE, ...PATH_B_STREAM]);
    for (const id of uniq) {
      expect(JAVA_REFERENCE[id], `JAVA_REFERENCE missing ${id}`).toBeDefined();
    }
  });

  it('suggested QA cards exist and sit in coop QA catalog', () => {
    const qa = COOP_QA_CATALOG_IDS;
    for (const id of QA_SUGGESTED) {
      expect(getCardById(id), `card ${id}`).toBeDefined();
      expect(qa.has(id), `${id} must be in COOP_QA_CATALOG_IDS`).toBe(true);
    }
  });

  it('admin has enough distinct infra-capable ids for 6-slot architecture gate', () => {
    const admin = COOP_ADMIN_CATALOG_IDS;
    const infraLike = [...admin].filter((id) => {
      const c = getCardById(id);
      return c && (c.type === 'INFRASTRUCTURE' || c.type === 'SCRIPT');
    });
    expect(infraLike.length).toBeGreaterThanOrEqual(6);
  });
});
