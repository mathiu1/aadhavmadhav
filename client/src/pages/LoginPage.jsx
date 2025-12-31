import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../slices/authSlice';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { userInfo, isLoading, error } = useSelector((state) => state.auth);

    const redirect = location.search ? location.search.split('=')[1] : '/';

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
        return () => {
            dispatch(clearError());
        };
    }, [navigate, userInfo, redirect, dispatch]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await dispatch(login({ email, password })).unwrap();
            toast.success('Welcome back!');
        } catch (err) {
            toast.error(err || 'Failed to login');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse-slow delay-700"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-8 md:p-10 rounded-[2rem] shadow-2xl relative z-10 border border-white/40"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Welcome Back</h1>
                    <p className="text-slate-500 font-medium">Enter your credentials to access your account</p>
                </div>

                <form onSubmit={submitHandler} className="space-y-6">
                    {/* Email Input */}
                    <div className="relative group">
                        <FaEnvelope className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors text-lg ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`input-field pl-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white transition-all ${error ? 'border-red-400 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-slate-200'}`}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors text-lg ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary'}`} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`input-field pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white transition-all ${error ? 'border-red-400 focus:border-red-500 text-red-900 placeholder-red-300' : 'border-slate-200'}`}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transform active:scale-95 transition-all flex justify-center items-center"
                    >
                        {isLoading ? <FaSpinner className="animate-spin text-2xl" /> : 'Log In'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 font-medium">
                    New to AadhavMadhav?{' '}
                    <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} className="text-primary hover:text-secondary font-bold transition-colors">
                        Create an account
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
