import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

const NotFoundPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-primary/5 to-secondary/5 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-white shadow-xl shadow-slate-100/50 max-w-lg w-full">
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2 select-none">404</h1>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Page Not Found</h2>

                <p className="text-slate-500 mb-8 leading-relaxed">
                    We couldn't find the page you were looking for. It may have been moved or doesn't exist anymore.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 rounded-xl shadow-lg shadow-primary/20">
                        <FaHome /> Go Home
                    </Link>
                    <Link to="/products" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                        <FaSearch /> Browse
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
