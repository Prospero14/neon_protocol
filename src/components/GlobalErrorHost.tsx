import { useEffect, useState, type ReactNode } from 'react';
import {
  installGlobalErrorHandlers,
  subscribeClientErrors,
  type ClientErrorReport,
} from '../logic/globalErrorHandler';
import { ClientErrorScreen } from './ClientErrorScreen';

export function GlobalErrorHost({ children }: { children: ReactNode }) {
  const [crash, setCrash] = useState<ClientErrorReport | null>(null);

  useEffect(() => {
    installGlobalErrorHandlers();
    return subscribeClientErrors(setCrash);
  }, []);

  if (crash) return <ClientErrorScreen report={crash} />;
  return children;
}
