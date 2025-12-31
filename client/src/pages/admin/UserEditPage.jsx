import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails, updateUser, resetUserUpdate } from '../../slices/userSlice';
import { FiArrowLeft, FiSave, FiUser, FiCalendar, FiMail, FiShield, FiCheckCircle, FiActivity, FiHeart, FiShoppingCart, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const UserEditPage = () => {
    const { id: userId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [joinDate, setJoinDate] = useState('');

    const { user, loading, error, updateSuccess } = useSelector((state) => state.user);

    useEffect(() => {
        if (updateSuccess) {
            toast.success('User updated successfully');
            dispatch(resetUserUpdate());
            navigate('/admin/users');
        } else {
            if (!user || user._id !== userId) {
                dispatch(getUserDetails(userId));
            } else {
                if (user.email === 'bot@aadhavmadhav.com') {
                    toast.error('Protected account: Cannot modify Admin Bot');
                    navigate('/admin/users');
                    return;
                }
                setName(user.name);
                setEmail(user.email);
                setIsAdmin(user.isAdmin);
                setJoinDate(user.createdAt);
            }
        }
    }, [dispatch, navigate, userId, user, updateSuccess]);

    const submitHandler = (e) => {
        e.preventDefault();
        dispatch(updateUser({ _id: userId, name, email, isAdmin }));
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Background Decor for Mobile/Desktop */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-60"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                {/* Header Navigation */}
                <Link to="/admin/users" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-bold mb-6 lg:mb-8 transition-colors text-sm group">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FiArrowLeft />
                    </div>
                    <span>Back to Users</span>
                </Link>

                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-12">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2">
                            Manage User
                        </h1>
                        <p className="text-slate-500 font-medium">Update profile settings and permissions.</p>
                    </div>
                    {!loading && !error && (
                        <div className={`self-start sm:self-auto px-4 py-2 rounded-2xl border flex items-center gap-2 ${isAdmin ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-primary animate-pulse' : 'bg-slate-400'}`}></span>
                            <span className="text-xs font-black uppercase tracking-wider">{isAdmin ? 'Admin Access' : 'Customer'}</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 border border-red-100 font-bold flex items-center gap-3 animate-shake shadow-sm">
                        <FiActivity size={20} /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-4"></div>
                        <p className="text-slate-400 font-bold animate-pulse">Loading user profile...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                        {/* LEFT COL: Profile Card (lg:col-span-4) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 via-slate-50/50 to-transparent"></div>

                                <div className="relative z-10">
                                    <div className="w-28 h-28 lg:w-36 lg:h-36 mx-auto bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-6 transform group-hover:scale-105 transition-transform duration-500">
                                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-4xl lg:text-5xl font-black uppercase">
                                            {name?.charAt(0) || <FiUser />}
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-black text-slate-900 mb-1">{name}</h2>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-xs font-bold text-slate-500 mb-6 max-w-full truncate">
                                        <FiMail className="text-primary flex-shrink-0" /> <span className="truncate">{email}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Joined</p>
                                            <p className="text-xs lg:text-sm font-bold text-slate-700">
                                                {joinDate ? new Date(joinDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : '-'}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Role</p>
                                            <p className="text-xs lg:text-sm font-bold text-slate-700">
                                                {isAdmin ? 'Admin' : 'User'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Action (Hidden on small mobile, visible on larger screens) */}
                            <div className="hidden sm:block bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-6 lg:p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <h3 className="font-black text-lg mb-2 relative z-10">Quick Contact</h3>
                                <p className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed">Need to communicate important updates?</p>
                                <a href={`mailto:${email}`} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors relative z-10">
                                    <FiMail /> Send Email
                                </a>
                            </div>
                        </div>

                        {/* RIGHT COL: Stats & Settings (lg:col-span-8) */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Stats Grid - Horizontal Scroll on Mobile */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
                                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-primary/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
                                        <FiHeart size={18} className="fill-pink-500/20" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1">{user?.favorites?.length || 0}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Favorites</p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                        <FiShoppingCart size={18} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-black text-slate-900 leading-none mb-1">{user?.cartItems?.length || 0}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">In Cart</p>
                                    </div>
                                </div>

                                <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                        <FiClock size={18} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-slate-900 leading-none mb-1">
                                            {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Last Active</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Form Card */}
                            <form onSubmit={submitHandler} className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                                <div className="p-6 lg:p-8 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
                                            <FiShield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg lg:text-xl font-black text-slate-900">System Permissions</h3>
                                            <p className="text-xs lg:text-sm font-medium text-slate-500">Control access levels.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 lg:p-8">
                                    <label className={`block relative p-4 lg:p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${isAdmin ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={isAdmin}
                                            onChange={(e) => setIsAdmin(e.target.checked)}
                                        />
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-8 bg-slate-200 rounded-full peer-focus:ring-4 peer-focus:ring-indigo-100 peer-checked:bg-primary relative transition-colors shrink-0 mt-1">
                                                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform border border-slate-300 peer-checked:border-transparent ${isAdmin ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`text-base lg:text-lg font-black ${isAdmin ? 'text-primary' : 'text-slate-700'}`}>Administrator Access</span>
                                                    {isAdmin && (
                                                        <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-in fade-in zoom-in duration-300">Active</span>
                                                    )}
                                                </div>
                                                <p className="text-xs lg:text-sm text-slate-500 font-medium leading-relaxed">
                                                    Grants full system access including product & user management.
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="bg-slate-50/50 p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <p className="text-xs font-bold text-slate-400 text-center sm:text-left">
                                        {isAdmin ? 'User has elevated privileges.' : 'Standard user privileges.'}
                                    </p>
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-xl lg:rounded-2xl font-black hover:bg-primary transition-all shadow-xl shadow-slate-900/10 hover:shadow-primary/30 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                    >
                                        <FiSave /> Save Changes
                                    </button>
                                </div>
                            </form>

                            {/* Mobile Contact Button (Visible only on small screens) */}
                            <a href={`mailto:${email}`} className="sm:hidden block w-full bg-white border border-indigo-100 text-indigo-600 py-3 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2">
                                <FiMail /> email user
                            </a>

                            {/* Additional Info Box */}
                            <div className="bg-blue-50/30 p-5 rounded-[1.5rem] border border-blue-100/50 flex items-start gap-4">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                    <FiActivity size={16} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-0.5">Activity Log</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Last update recorded on {new Date().toLocaleDateString()}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserEditPage;
