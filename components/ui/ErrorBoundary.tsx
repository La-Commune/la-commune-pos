"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Module name for display, e.g. "Órdenes" */
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[ErrorBoundary${this.props.moduleName ? ` - ${this.props.moduleName}` : ""}]`,
        error,
        errorInfo
      );
    }
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-status-err-bg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-status-err" />
            </div>
            <h2 className="text-base font-medium text-text-100 mb-2">
              {this.props.moduleName
                ? `Error en ${this.props.moduleName}`
                : "Algo salió mal"}
            </h2>
            <p className="text-sm text-text-45 mb-1">
              Ocurrió un error inesperado.
            </p>
            <p className="text-xs text-text-25 mb-6 font-mono break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-primary text-[13px] min-h-[44px]"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
