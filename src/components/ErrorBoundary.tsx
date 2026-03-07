import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0a0a0a',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: '#0df20d', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            PickLabs — Startup Error
          </h1>
          <p style={{ color: '#aaa', marginBottom: '1rem', maxWidth: '600px' }}>
            The app crashed during initialization. Please refresh or clear your browser cache.
          </p>
          <details style={{ background: '#111', padding: '1rem', borderRadius: '8px', maxWidth: '800px', textAlign: 'left', color: '#f87171' }}>
            <summary style={{ cursor: 'pointer', color: '#fff', marginBottom: '0.5rem' }}>Error Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              background: '#0df20d',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
