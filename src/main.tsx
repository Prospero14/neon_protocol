import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './logic/AuthContext.tsx'
import { GlobalErrorHost } from './components/GlobalErrorHost.tsx'
import { ClientErrorScreen } from './components/ClientErrorScreen.tsx'
import { reportClientError } from './logic/globalErrorHandler.ts'

class RootErrorBoundary extends Component<{ children: ReactNode }, { report: { error: Error; source: string } | null }> {
  state: { report: { error: Error; source: string } | null } = { report: null };

  static getDerivedStateFromError(err: Error) {
    return { report: { error: err, source: 'react.render' } };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    reportClientError(err, 'react.render');
    if (import.meta.env.DEV) console.error('RootErrorBoundary stack', info.componentStack);
  }

  render() {
    if (this.state.report) {
      return <ClientErrorScreen report={this.state.report} />;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!, {
  onUncaughtError: (error) => {
    reportClientError(error, 'react.uncaught');
  },
}).render(
  <StrictMode>
    <GlobalErrorHost>
      <RootErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RootErrorBoundary>
    </GlobalErrorHost>
  </StrictMode>,
)
