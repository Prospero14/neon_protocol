import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './logic/AuthContext.tsx'

class RootErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('RootErrorBoundary', err, info.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: '2rem',
            background: '#0d0208',
            color: '#ff6b6b',
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h1 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Neon Protocol — сбой клиента</h1>
          <p>{this.state.err.message}</p>
          <p style={{ marginTop: '1rem', color: '#8a9aaa', fontSize: '0.85rem' }}>
            Часто помогает режим инкогнито или очистка данных сайта для этого домена (localStorage).
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
