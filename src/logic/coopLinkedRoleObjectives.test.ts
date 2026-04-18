import { describe, expect, it } from 'vitest';
import type { TechnicalTask } from './combatTasks';
import {
  buildCoopLinkedRoleObjectives,
  emptyCoopLinkedTrack,
  nextCoopLinkedAwards,
  objectiveCurrent,
} from './coopLinkedRoleObjectives';

const stubMission = (steps: number): TechnicalTask => ({
  id: 'test_mission',
  name: 'TEST',
  description: 'd',
  rank: 'junior',
  steps: Array.from({ length: steps }, (_, i) => ({
    id: String(i + 1),
    name: `S${i + 1}`,
    requiredCardId: 'syntax_class_decl',
  })),
});

describe('buildCoopLinkedRoleObjectives', () => {
  it('scales admin infra targets with step count', () => {
    const a = buildCoopLinkedRoleObjectives(stubMission(3), 'admin');
    expect(a[0].kind).toBe('admin_infra_deploys');
    expect(a[0].target).toBe(2);
    const b = buildCoopLinkedRoleObjectives(stubMission(12), 'admin');
    expect(b[0].target).toBe(4);
  });

  it('switches PM first objective when architecture is skipped', () => {
    const arch = buildCoopLinkedRoleObjectives(stubMission(8), 'pm', { skipArchitecture: false });
    expect(arch[0].kind).toBe('pm_soft_arch_placed');
    const dev = buildCoopLinkedRoleObjectives(stubMission(8), 'pm', { skipArchitecture: true });
    expect(dev[0].kind).toBe('pm_soft_dev_placed');
  });

  it('returns empty for developer', () => {
    expect(buildCoopLinkedRoleObjectives(stubMission(5), 'developer')).toEqual([]);
  });
});

describe('nextCoopLinkedAwards', () => {
  it('awards progress when thresholds met', () => {
    const mission = stubMission(10);
    const track = emptyCoopLinkedTrack();
    track.adminInfra = 4;
    track.adminInfraIds = new Set(['a', 'b', 'c', 'd']);
    const awarded = new Set<string>();
    const res = nextCoopLinkedAwards(mission, 'admin', track, awarded);
    expect(res.newAwarded.length).toBe(2);
    expect(res.progressDelta).toBeGreaterThan(0);
  });

  it('reads pm_soft_dev_placed for skipArchitecture PM', () => {
    const mission = stubMission(6);
    const defs = buildCoopLinkedRoleObjectives(mission, 'pm', { skipArchitecture: true });
    expect(defs[0].kind).toBe('pm_soft_dev_placed');
    const track = emptyCoopLinkedTrack();
    track.pmSoftDevPlaced = defs[0].target;
    const awarded = new Set<string>();
    const cur = objectiveCurrent(defs[0].kind, track);
    expect(cur).toBeGreaterThanOrEqual(defs[0].target);
    const res = nextCoopLinkedAwards(mission, 'pm', track, awarded, { skipArchitecture: true });
    expect(res.newAwarded).toContain(defs[0].id);
  });
});
