import { useState, useEffect } from 'react';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const updateStatus = () => setIsOnline(navigator.onLine);

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);

        const interval = setInterval(() => {
            setIsOnline(navigator.onLine);
        }, 1000);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            clearInterval(interval);
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${!isOnline ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        >
            <div
                className={`bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full text-center shadow-2xl relative overflow-hidden transition-all duration-500 ${!isOnline ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-8 opacity-0'}`}
                style={{ transitionTimingFunction: !isOnline ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-in' }}
            >
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiWifiOff className="text-4xl" />
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-3">No Internet Connection</h2>

                <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                    It looks like you're offline. Please check your internet connection and try again.
                </p>

                <div className="w-16 h-1 bg-red-100 rounded-full mx-auto mb-8">
                    <div className="h-full bg-red-500 rounded-full w-2/3 mx-auto animate-pulse"></div>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 active:scale-95 flex items-center justify-center gap-2"
                >
                    <FiRefreshCw /> Try Again
                </button>
            </div>
        </div>
    );
};

export default NetworkStatus;
