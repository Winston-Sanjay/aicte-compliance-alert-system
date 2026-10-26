import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card card-body p-8 text-center my-4 border border-red-200 bg-red-50/50 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {this.props.fallbackTitle || 'Something went wrong displaying this section'}
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto mb-4">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected error occurred while rendering this tab.'}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="btn-secondary btn-sm inline-flex items-center gap-1.5 mx-auto"
          >
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
