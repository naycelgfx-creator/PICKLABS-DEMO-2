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
        <div className="bg-[#0a0a0a] text-white min-h-screen flex flex-col items-center justify-center font-mono p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-[#0df20d] text-2xl mb-2">
            PickLabs — Startup Error
          </h1>
          <p className="text-[#aaa] mb-4 max-w-xl">
            The app crashed during initialization. Please refresh or clear your browser cache.
          </p>
          <details className="bg-[#111] p-4 rounded-lg max-w-3xl text-left text-red-400">
            <summary className="cursor-pointer text-white mb-2">Error Details</summary>
            <pre className="whitespace-pre-wrap break-all text-xs">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="mt-6 px-8 py-3 bg-[#0df20d] text-black border-none rounded-lg font-bold cursor-pointer text-sm hover:bg-[#a3ff00] transition-colors"
          >
            Clear Cache &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
