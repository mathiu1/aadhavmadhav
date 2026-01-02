import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../slices/authSlice';
import { getUnreadCount } from '../slices/errorLogSlice';
import { useEffect } from 'react';
import {
    FiGrid,
    FiShoppingBag,
    FiBox,
    FiUsers,
    FiChevronRight,
    FiSettings,
    FiLogOut,
    FiStar,
    FiX,
    FiAlertCircle,
    FiLayout
} from 'react-icons/fi';

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { unreadCount } = useSelector((state) => state.errorLogs);

    useEffect(() => {
        dispatch(getUnreadCount());
    }, [dispatch]);

    const logoutHandler = () => {
        dispatch(logout());
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: <FiGrid />, label: 'Dashboard' },
        { path: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
        { path: '/admin/products', icon: <FiBox />, label: 'Products' },
        { path: '/admin/users', icon: <FiUsers />, label: 'Users' },
        { path: '/admin/reviews', icon: <FiStar />, label: 'Reviews' },
        { path: '/admin/content', icon: <FiLayout />, label: 'Content' },
        { path: '/admin/errors', icon: <FiAlertCircle />, label: 'Error Logs' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={toggleSidebar}
                ></div>
            )}

            <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-400 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo Section */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <Link to="/" className="text-white text-xl font-black flex items-center gap-2">
                            <span className="text-primary tracking-tighter italic">▲ Aadhav</span>
                            <span className="text-white tracking-tighter">Madhav</span>
                        </Link>
                        <p className="text-[10px] uppercase tracking-[3px] font-bold text-slate-500 mt-2">Admin Panel</p>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) toggleSidebar();
                            }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-primary text-white shadow-lg shadow-purple-900/40'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <span className={`text-xl ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-primary'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                                {item.path === '/admin/errors' && unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/50 animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {isActive(item.path) && !['/admin/errors'].includes(item.path) && <FiChevronRight className="text-white/50" />}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-6 border-t border-slate-800">
                    <div className="space-y-4">
                        <button
                            onClick={logoutHandler}
                            className="flex items-center gap-3 text-sm font-bold text-red-400 hover:text-red-300 transition-colors w-full text-left"
                        >
                            <FiLogOut /> Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
