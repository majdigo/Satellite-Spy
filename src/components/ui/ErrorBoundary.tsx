"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full bg-military-dark flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <div className="text-red-500 text-2xl font-mono mb-4">!</div>
              <div className="text-sm font-mono text-red-400 mb-2">
                SYSTEM ERROR
              </div>
              <div className="text-[10px] font-mono text-gray-600 mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </div>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="text-[10px] font-mono text-military-green border border-military-green/30 px-4 py-1.5 hover:bg-military-green/10 transition-colors"
              >
                RETRY
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
