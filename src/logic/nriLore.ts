/** Лор стола: мир, фракции, карточки мест. */

export type NriFaction = {
  id: string;
  name: string;
  description: string;
  color: string | null;
  memberPlayerIds: string[];
  memberNpcIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type NriLoreEntry = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type NriLorePlace = {
  id: string;
  title: string;
  body: string;
  zoneKey: string | null;
  mapMarkerId: string | null;
  x: number | null;
  y: number | null;
  sourceScenarioNodeId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type NriScenarioProgress = {
  currentScriptNodeId: string | null;
  completedNodeIds: string[];
  updatedAt: number;
};

export type NriPlayerPosition = {
  userId: string;
  displayName?: string;
  zoneKey: string | null;
  x: number | null;
  y: number | null;
  vehicleId: string | null;
  vehicleOverload: boolean;
  updatedAt: number;
};

export type NriHostAlert = {
  id: string;
  fromUserId: string;
  fromDisplayName?: string;
  kind: string;
  body: string;
  read: boolean;
  createdAt: number;
};

export type CheckpointStatus = {
  nodeId: string;
  met: boolean;
  reason?: string;
};

export function parseIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export function parseProgress(raw: unknown): NriScenarioProgress {
  if (!raw || typeof raw !== 'object') {
    return { currentScriptNodeId: null, completedNodeIds: [], updatedAt: Date.now() };
  }
  const o = raw as Record<string, unknown>;
  return {
    currentScriptNodeId: typeof o.currentScriptNodeId === 'string' ? o.currentScriptNodeId : null,
    completedNodeIds: parseIdList(o.completedNodeIds),
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now(),
  };
}
