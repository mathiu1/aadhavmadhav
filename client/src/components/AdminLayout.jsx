import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { FiMenu, FiX } from 'react-icons/fi';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-30 flex items-center justify-between">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                    <div className="font-black text-xl italic tracking-tighter">
                        <span className="text-primary">▲ Aadhav</span>Madhav
                    </div>
                </header>

                <main className="flex-1 lg:ml-64 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
