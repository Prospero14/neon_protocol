/** Scenario nodes + progress */

import type { NriScenarioLinks, NriScenarioNode } from '../nriScenario';
import type { NriScenarioProgress } from '../nriLore';
import { nriAuthHeaders, nriParseJson, parseNriApiError } from './http.js';

const parseJson = nriParseJson;
const authHeaders = nriAuthHeaders;
const parseApiError = parseNriApiError;

export async function nriFetchScenario(
  token: string,
  code: string
): Promise<
  | { ok: true; nodes: NriScenarioNode[]; progress: NriScenarioProgress }
  | { ok: false; error: string }
> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/scenario`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось загрузить сценарий') };
  }
  return {
    ok: true,
    nodes: (data.nodes ?? []) as NriScenarioNode[],
    progress: (data.progress ?? {
      currentScriptNodeId: null,
      completedNodeIds: [],
      updatedAt: Date.now(),
    }) as NriScenarioProgress,
  };
}

export async function nriCreateScenarioNode(
  token: string,
  code: string,
  payload: {
    parentId?: string | null;
    title: string;
    body?: string;
    links?: NriScenarioLinks;
    sortOrder?: number;
  }
): Promise<{ ok: true; node: NriScenarioNode } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/scenario`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать узел') };
  return { ok: true, node: data.node as NriScenarioNode };
}

export async function nriPatchScenarioNode(
  token: string,
  code: string,
  nodeId: string,
  payload: Partial<{
    title: string;
    body: string;
    links: NriScenarioLinks;
    sortOrder: number;
    parentId: string | null;
  }>
): Promise<{ ok: true; node: NriScenarioNode } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/scenario/${encodeURIComponent(nodeId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить узел') };
  return { ok: true, node: data.node as NriScenarioNode };
}

export async function nriDeleteScenarioNode(token: string, code: string, nodeId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/scenario/${encodeURIComponent(nodeId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriPatchScenarioProgress(
  token: string,
  code: string,
  payload: { currentScriptNodeId?: string | null; completeNodeId?: string }
): Promise<NriScenarioProgress | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/scenario/progress`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.progress as NriScenarioProgress;
}
