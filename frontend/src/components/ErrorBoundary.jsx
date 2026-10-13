import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
          <div className="bg-rose-100 text-rose-600 p-6 rounded-2xl max-w-md w-full shadow-sm">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm opacity-90 mb-4 text-left font-mono bg-rose-50 p-3 rounded-lg overflow-x-auto">
              {this.state.error?.toString()}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-rose-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-rose-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
