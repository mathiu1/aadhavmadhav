import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.setState({ error: error, errorInfo: errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-xl border border-slate-100">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiAlertTriangle className="text-5xl" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            We're sorry, but an unexpected error has occurred. Please try refreshing the page or come back later.
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl text-left mb-8 overflow-auto max-h-40 text-xs font-mono text-slate-600 border border-slate-200">
                            {this.state.error && this.state.error.toString()}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                <FiRefreshCw /> Refresh Page
                            </button>
                            <Link
                                to="/"
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
