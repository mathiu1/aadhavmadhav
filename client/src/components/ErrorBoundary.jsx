import React from 'react';
import api from '../api/axios';
import { FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorLogId: null,
            feedback: '',
            feedbackSubmitted: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log to backend
        const logError = async () => {
            try {
                const { data } = await api.post('/errors/client', {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    path: window.location.pathname
                });
                if (data && data.errorLogId) {
                    this.setState({ errorLogId: data.errorLogId });
                }
            } catch (err) {
                console.error("Failed to log client error:", err);
            }
        };
        logError();
    }

    handleFeedbackSubmit = async (e) => {
        e.preventDefault();

        try {
            if (this.state.errorLogId) {
                await api.post('/errors/feedback', {
                    errorLogId: this.state.errorLogId,
                    feedback: this.state.feedback
                });
            } else {
                // Ignore if ID missing for now
            }
            this.setState({ feedbackSubmitted: true });
        } catch (err) {
            console.error("Failed to submit feedback:", err);
            // Show success anyway to user
            this.setState({ feedbackSubmitted: true });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl shadow-slate-200/50 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner text-5xl">
                            <FiAlertTriangle />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 font-medium mb-8">
                            We're sorry, but an unexpected error has occurred. Our team has been notified.
                        </p>

                        {!this.state.feedbackSubmitted ? (
                            <form onSubmit={this.handleFeedbackSubmit} className="text-left mb-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                                    Help us fix this (Optional)
                                </label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all resize-none"
                                    rows="4"
                                    placeholder="What were you doing when this happened?"
                                    value={this.state.feedback}
                                    onChange={(e) => this.setState({ feedback: e.target.value })}
                                ></textarea>
                                <button
                                    type="submit"
                                    className="w-full mt-4 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!this.state.feedback.trim()}
                                >
                                    Send Feedback
                                </button>
                            </form>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl font-bold mb-8 border border-emerald-100">
                                Thank you! Your feedback has been sent.
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                        >
                            Or try refreshing the page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
