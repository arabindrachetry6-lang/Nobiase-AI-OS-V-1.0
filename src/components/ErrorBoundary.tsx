import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              {errorDetails ? (
                <span>
                  A database permission error occurred. This might be due to an incorrect configuration or role assignment.
                </span>
              ) : (
                <span>An unexpected error occurred. Please try refreshing the page.</span>
              )}
            </p>

            {errorDetails && (
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left overflow-hidden">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Error Context</p>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                  <p><span className="text-blue-500">Operation:</span> {errorDetails.operationType}</p>
                  <p><span className="text-blue-500">Path:</span> {errorDetails.path}</p>
                  <p><span className="text-blue-500">User:</span> {errorDetails.authInfo.userId || 'Not Logged In'}</p>
                </div>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <RefreshCcw size={20} />
              <span>Refresh Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
