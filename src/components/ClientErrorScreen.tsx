import type { ClientErrorReport } from '../logic/globalErrorHandler';

type Props = {
  report: ClientErrorReport;
};

export function ClientErrorScreen({ report }: Props) {
  const { error, source } = report;

  return (
    <div
      className="client-error-screen"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        background: '#0d0208',
        color: '#ffb4b4',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <h1 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
        NEON PROTOCOL — СБОЙ КЛИЕНТА
      </h1>
      <p style={{ color: '#8a9aaa', fontSize: '0.8rem', marginBottom: '1rem' }}>Источник: {source}</p>
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1rem' }}>{error.message}</p>
      {error.stack && (
        <pre
          style={{
            margin: '0 0 1.25rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,107,107,0.25)',
            borderRadius: 4,
            fontSize: '0.72rem',
            lineHeight: 1.45,
            overflow: 'auto',
            maxHeight: '42vh',
            color: '#d4dde8',
            whiteSpace: 'pre-wrap',
          }}
        >
          {error.stack}
        </pre>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.55rem 1rem',
            background: '#0ff',
            color: '#0d0208',
            border: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          [ ПЕРЕЗАГРУЗИТЬ ]
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.hash = '';
            window.location.pathname = '/';
            window.location.reload();
          }}
          style={{
            padding: '0.55rem 1rem',
            background: 'transparent',
            color: '#0ff',
            border: '1px solid #0ff',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          [ НА ГЛАВНУЮ ]
        </button>
      </div>
      <p style={{ marginTop: '1.25rem', color: '#8a9aaa', fontSize: '0.8rem', maxWidth: '52rem' }}>
        Если ошибка повторяется после входа — попробуйте выйти из аккаунта или очистить localStorage для этого
        домена. Битое сохранение иногда лечится повторным логином с сервера.
      </p>
    </div>
  );
}
