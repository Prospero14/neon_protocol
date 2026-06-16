import type { CoopMatch, CoopMatchIntent } from './coopMatchStore.js';

export type MatchEventEmitter = (
  match: CoopMatch,
  type: string,
  actorUserId: string | null,
  payload: Record<string, unknown>,
) => void;

export function recomputeTeamStress(match: CoopMatch): void {
  match.shared.stress = Math.min(
    100,
    Math.round(
      (match.shared.roleStress.admin +
        match.shared.roleStress.developer +
        match.shared.roleStress.qa +
        match.shared.roleStress.pm) /
        4,
    ),
  );
}

export function compactMatchView(match: CoopMatch) {
  return {
    id: match.id,
    partyId: match.partyId,
    hostId: match.hostId,
    status: match.status,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    memberIds: match.memberIds,
    roleByUserId: match.roleByUserId,
    shared: match.shared,
    seq: match.seq,
    linkedObjectiveAwardedIds: match.linkedObjectiveAwardedIds ?? [],
    recentEvents: match.events.slice(-30),
  };
}

export function normalizeTargetRole(
  payload: Record<string, unknown>,
): 'admin' | 'developer' | 'qa' | 'pm' | null {
  if (typeof payload.targetRole === 'string' && ['admin', 'developer', 'qa', 'pm'].includes(payload.targetRole)) {
    return payload.targetRole as 'admin' | 'developer' | 'qa' | 'pm';
  }
  return null;
}

export function applyMatchIntent(
  match: CoopMatch,
  intent: CoopMatchIntent,
  emit: MatchEventEmitter,
): { ok: boolean; reason?: string } {
  const payload = intent.payload ?? {};
  const role = intent.role;
  const targetRole = normalizeTargetRole(payload);

  if (intent.action === 'apply_admin_infra') {
    if (role !== 'admin') return { ok: false, reason: 'ROLE_DENIED' };
    if ((match.shared.supportCooldownByRole.admin ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
    const reliabilityUp = Math.max(0, Math.min(20, Number(payload.reliabilityUp ?? 8)));
    const resourcesDown = Math.max(0, Math.min(20, Number(payload.resourcesDown ?? 4)));
    const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 2)));
    match.shared.infraReliability = Math.min(100, match.shared.infraReliability + reliabilityUp);
    match.shared.infraResources = Math.max(0, match.shared.infraResources - resourcesDown);
    match.shared.roleTaskProgress.admin = Math.min(100, match.shared.roleTaskProgress.admin + reliabilityUp);
    if (targetRole && targetRole !== 'admin') {
      match.shared.roleTaskProgress[targetRole] = Math.min(
        100,
        (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(reliabilityUp / 2)),
      );
      match.shared.roleStress[targetRole] = Math.max(0, (match.shared.roleStress[targetRole] ?? 0) - 2);
    }
    match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressUp);
    match.shared.supportCooldownByRole.admin = 1;
    recomputeTeamStress(match);
    emit(match, intent.action, intent.userId, { reliabilityUp, resourcesDown, stressUp, targetRole });
    return { ok: true };
  }

  if (intent.action === 'apply_qa_defense') {
    if (role !== 'qa') return { ok: false, reason: 'ROLE_DENIED' };
    if ((match.shared.supportCooldownByRole.qa ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
    const bugsDown = Math.max(0, Math.min(20, Number(payload.bugsDown ?? 7)));
    const relUp = Math.max(0, Math.min(10, Number(payload.reliabilityUp ?? 3)));
    const stressDown = Math.max(0, Math.min(15, Number(payload.stressDown ?? 4)));
    match.shared.bugPressure = Math.max(0, match.shared.bugPressure - bugsDown);
    match.shared.infraReliability = Math.min(100, match.shared.infraReliability + relUp);
    match.shared.roleTaskProgress.qa = Math.min(100, match.shared.roleTaskProgress.qa + bugsDown);
    if (targetRole && targetRole !== 'qa') {
      match.shared.roleTaskProgress[targetRole] = Math.min(
        100,
        (match.shared.roleTaskProgress[targetRole] ?? 0) + Math.max(2, Math.floor(bugsDown / 3)),
      );
    }
    match.shared.roleStress.qa = Math.max(0, match.shared.roleStress.qa - stressDown);
    match.shared.supportCooldownByRole.qa = 1;
    recomputeTeamStress(match);
    emit(match, intent.action, intent.userId, { bugsDown, reliabilityUp: relUp, stressDown, targetRole });
    return { ok: true };
  }

  if (intent.action === 'apply_pm_support') {
    if (role !== 'pm') return { ok: false, reason: 'ROLE_DENIED' };
    if ((match.shared.supportCooldownByRole.pm ?? 0) > 0) return { ok: false, reason: 'COOLDOWN' };
    const stressDown = Math.max(0, Math.min(20, Number(payload.stressDown ?? 9)));
    const deadlineUp = Math.max(0, Math.min(3, Number(payload.deadlineUp ?? 1)));
    const pmTargetRole = targetRole ?? 'developer';
    match.shared.roleTaskProgress.pm = Math.min(100, match.shared.roleTaskProgress.pm + deadlineUp * 10);
    match.shared.roleStress.pm = Math.max(0, match.shared.roleStress.pm - Math.max(1, Math.floor(stressDown / 2)));
    match.shared.roleStress[pmTargetRole] = Math.max(0, match.shared.roleStress[pmTargetRole] - stressDown);
    match.shared.deadlineTicks = Math.min(40, match.shared.deadlineTicks + deadlineUp);
    match.shared.supportCooldownByRole.pm = 1;
    recomputeTeamStress(match);
    emit(match, intent.action, intent.userId, { stressDown, deadlineUp, targetRole: pmTargetRole });
    return { ok: true };
  }

  if (intent.action === 'apply_dev_progress') {
    if (role !== 'developer') return { ok: false, reason: 'ROLE_DENIED' };
    const progressUp = Math.max(0, Math.min(25, Number(payload.progressUp ?? 10)));
    const stressUp = Math.max(0, Math.min(15, Number(payload.stressUp ?? 4)));
    match.shared.projectProgress = Math.min(100, match.shared.projectProgress + progressUp);
    match.shared.roleTaskProgress.developer = Math.min(100, match.shared.roleTaskProgress.developer + progressUp);
    match.shared.roleStress.developer = Math.min(100, match.shared.roleStress.developer + stressUp);
    recomputeTeamStress(match);
    emit(match, intent.action, intent.userId, { progressUp, stressUp });
    return { ok: true };
  }

  return { ok: false, reason: 'UNKNOWN_ACTION' };
}

export function resolveParallelWindow(match: CoopMatch, byUserId: string, emit: MatchEventEmitter): void {
  const acceptedRoles = new Set<string>();
  const intents = [...match.intentQueue].sort((a, b) => a.ts - b.ts);
  let applied = 0;
  for (const intent of intents) {
    if (acceptedRoles.has(intent.role)) continue;
    const r = applyMatchIntent(match, intent, emit);
    if (r.ok) {
      acceptedRoles.add(intent.role);
      applied += 1;
    }
  }
  match.intentQueue = [];
  match.shared.queuedIntents = 0;
  const intensity = Math.max(1, Math.min(4, Math.floor(match.shared.missionIntensityTier || 1)));
  const missionSteps = Math.max(1, Math.floor(match.shared.missionStepTarget || 8));
  const longRunFactor = Math.max(1, Math.floor((missionSteps - 8) / 2));
  const bugPulse = Math.max(0, intensity + Math.floor(longRunFactor / 3));
  const stressPulse = Math.max(0, Math.floor(intensity / 2) + Math.floor(longRunFactor / 4));
  const infraPulse = Math.max(0, Math.floor((intensity - 1) / 2) + Math.floor(longRunFactor / 5));
  match.shared.bugPressure = Math.min(100, match.shared.bugPressure + bugPulse);
  match.shared.infraReliability = Math.max(0, match.shared.infraReliability - infraPulse);
  match.shared.roleStress.qa = Math.min(100, match.shared.roleStress.qa + stressPulse);
  match.shared.roleStress.admin = Math.min(100, match.shared.roleStress.admin + stressPulse);
  match.shared.roleStress.pm = Math.min(100, match.shared.roleStress.pm + stressPulse);
  match.shared.pressurePulse = { bug: bugPulse, stress: stressPulse, infra: infraPulse };
  recomputeTeamStress(match);
  const order = ['admin', 'developer', 'qa', 'pm'];
  for (const r of order) {
    const prev = match.shared.supportCooldownByRole[r] ?? 0;
    if (prev > 0) match.shared.supportCooldownByRole[r] = prev - 1;
  }
  match.shared.turn += 1;
  match.shared.deadlineTicks = Math.max(0, match.shared.deadlineTicks - 1);
  match.shared.activeRole = 'parallel';
  match.shared.parallelWindowEndsAt = Date.now() + match.shared.parallelWindowMs;
  emit(match, 'parallel_window_resolved', byUserId, {
    applied,
    intents: intents.length,
    pressurePulse: match.shared.pressurePulse,
    missionIntensityTier: match.shared.missionIntensityTier,
    missionStepTarget: match.shared.missionStepTarget,
  });
}

export function checkReleaseResult(match: CoopMatch): { ok: boolean; note: string } {
  const progressOk = match.shared.projectProgress >= 85;
  const bugsOk = match.shared.bugPressure <= 10;
  const stressOk = match.shared.stress <= 70;
  const infraOk = match.shared.infraReliability >= 55;
  const deadlineOk = match.shared.deadlineTicks > 0;
  const ok = progressOk && bugsOk && stressOk && infraOk && deadlineOk;
  const note = ok
    ? 'RELEASE_OK: команда закрыла окно качества и срока.'
    : `RELEASE_FAIL: ${progressOk ? '' : 'progress<85 '} ${bugsOk ? '' : 'bugs>10 '} ${stressOk ? '' : 'stress>70 '} ${
        infraOk ? '' : 'infra<55 '
      }${deadlineOk ? '' : 'deadline=0 '}`.trim();
  return { ok, note };
}
