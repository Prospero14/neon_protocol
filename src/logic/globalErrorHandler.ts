/** Глобальный канал фатальных ошибок клиента (React boundary + window.onerror). */

export type ClientErrorReport = {
  error: Error;
  source: string;
};

type Listener = (report: ClientErrorReport) => void;

const listeners = new Set<Listener>();

function toError(raw: unknown): Error {
  if (raw instanceof Error) return raw;
  if (typeof raw === 'string') return new Error(raw);
  try {
    return new Error(JSON.stringify(raw));
  } catch {
    return new Error(String(raw));
  }
}

export function reportClientError(raw: unknown, source = 'client'): void {
  const error = toError(raw);
  console.error(`[${source}]`, error);
  const report: ClientErrorReport = { error, source };
  for (const fn of listeners) fn(report);
}

export function subscribeClientErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let installed = false;

export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (ev) => {
    reportClientError(ev.error ?? ev.message, 'window.error');
  });

  window.addEventListener('unhandledrejection', (ev) => {
    const raw = ev.reason;
    const msg = raw instanceof Error ? raw.message : String(raw ?? '');
    if (msg === 'Failed to fetch' || /networkerror|load failed/i.test(msg)) {
      console.warn('[network] unhandled fetch rejection (suppressed fatal UI):', raw);
      ev.preventDefault();
      return;
    }
    reportClientError(raw, 'unhandledrejection');
  });
}
