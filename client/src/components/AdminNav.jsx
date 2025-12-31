import { Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiBox, FiUsers, FiGrid } from 'react-icons/fi';

const AdminNav = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-500 hover:text-primary hover:bg-slate-50';
    };

    return (
        <div className="flex flex-wrap gap-4 mb-8">
            <Link to="/admin/dashboard" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isActive('/admin/dashboard')}`}>
                <FiGrid /> Dashboard
            </Link>
            <Link to="/admin/orders" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isActive('/admin/orders')}`}>
                <FiShoppingBag /> Orders
            </Link>
            <Link to="/admin/products" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isActive('/admin/products')}`}>
                <FiBox /> Products
            </Link>
            {/* Future: Users */}
            <Link to="/admin/users" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isActive('/admin/users')}`}>
                <FiUsers /> Users
            </Link>
        </div>
    );
};

export default AdminNav;
