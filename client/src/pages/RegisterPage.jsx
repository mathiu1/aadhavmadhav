import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../slices/authSlice';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(null);

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
        setMessage(null);
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
        } else {
            try {
                await dispatch(register({ name, email, password })).unwrap();
                toast.success('Registration successful!');
            } catch (err) {
                toast.error(err || 'Registration failed');
            }
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden py-10">
            {/* Background Decorations */}
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse-slow delay-700"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card w-full max-w-md p-8 md:p-10 rounded-[2rem] shadow-2xl relative z-10 border border-white/40"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Create Account</h1>
                    <p className="text-slate-500 font-medium">Join the revolution today</p>
                </div>

                <form onSubmit={submitHandler} className="space-y-4">
                    {/* Name Input */}
                    <div className="relative group">
                        <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field pl-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white border-slate-200"
                            required
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative group">
                        <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field pl-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white border-slate-200"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative group">
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white border-slate-200"
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

                    {/* Confirm Password Input */}
                    <div className="relative group">
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-lg" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 focus:bg-white border-slate-200"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transform active:scale-95 transition-all flex justify-center items-center mt-2"
                    >
                        {isLoading ? <FaSpinner className="animate-spin text-2xl" /> : 'Register'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 font-medium">
                    Already have an account?{' '}
                    <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="text-secondary hover:text-primary font-bold transition-colors">
                        Log In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
