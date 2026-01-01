import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listOrders, listOrdersByUser } from '../../slices/orderSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiCheck, FiX, FiInfo, FiShoppingBag, FiCalendar, FiUser, FiDollarSign, FiFilter, FiChevronLeft, FiChevronRight, FiTruck, FiPackage, FiAlertTriangle, FiSearch } from 'react-icons/fi';

const OrderListPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const [filterStatus, setFilterStatus] = useState('all'); // all, paid, unpaid, delivered
    const [searchQuery, setSearchQuery] = useState(''); // Search state

    // Get user filter from URL
    const queryParams = new URLSearchParams(location.search);
    const userFilterId = queryParams.get('user');

    const { orderList } = useSelector((state) => state.order);
    const { loading, error, orders } = orderList;

    // Fetch orders based on whether we are viewing a specific user or all orders
    useEffect(() => {
        if (userFilterId) {
            dispatch(listOrdersByUser(userFilterId));
            setTimeFilter('all');
        } else {
            dispatch(listOrders());
        }
    }, [dispatch, userFilterId]);

    const [timeFilter, setTimeFilter] = useState('today'); // today, week, month, year, all, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(false);

    // Helper to check date range
    const isWithinTimeFilter = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        switch (timeFilter) {
            case 'today':
                return new Date(dateStr).setHours(0, 0, 0, 0) === startOfDay.getTime();
            case 'week': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return date >= startOfWeek;
            }
            case 'month':
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            case 'year':
                return date.getFullYear() === now.getFullYear();
            case 'custom':
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    // Set end date to end of day for inclusive comparison
                    end.setHours(23, 59, 59, 999);
                    return date >= start && date <= end;
                }
                return true;
            case 'all':
            default:
                return true;
        }
    };

    // Derived state for filtering
    const filteredOrders = orders?.filter(order => {
        // 0. User Filter (from URL)
        if (userFilterId) {
            if (!order.user || order.user._id !== userFilterId) {
                return false;
            }
        }

        // 1. Search Filter
        if (searchQuery) {
            if (!order._id.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
        }

        // 2. Time Filter
        if (!isWithinTimeFilter(order.createdAt)) return false;

        // 3. Status Filter
        if (filterStatus === 'all') return true;
        if (filterStatus === 'paid') return order.isPaid;
        if (filterStatus === 'unpaid') return !order.isPaid;
        if (filterStatus === 'delivered') return order.isDelivered;
        if (filterStatus === 'processing') return !order.isDelivered && order.status !== 'Shipped' && order.status !== 'Cancelled';
        if (filterStatus === 'shipped') return order.status === 'Shipped';
        if (filterStatus === 'cancelled') return order.status === 'Cancelled';
        return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination State & Logic
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [pageInput, setPageInput] = useState('1');

    const totalPages = filteredOrders ? Math.ceil(filteredOrders.length / itemsPerPage) : 0;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders ? filteredOrders.slice(indexOfFirstItem, indexOfLastItem) : [];

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setPageInput(String(pageNumber));
        }
    };

    const handleLimitChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
        setPageInput('1');
    };

    const handlePageInput = (val) => {
        const pageNumber = Number(val);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        } else {
            setPageInput(String(currentPage)); // Reset to current if invalid
        }
    };

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
        setPageInput('1');
    }, [filterStatus, timeFilter, customStartDate, customEndDate, searchQuery]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    const filters = [
        { label: 'All Orders', value: 'all' },
        { label: 'Pending', value: 'processing' },
        { label: 'Shipping', value: 'shipped' },
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
    ];

    const filteredUserName = userFilterId && orders?.length > 0 ? orders[0]?.user?.name : 'User';

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-10 pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        {userFilterId ? (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link to="/admin/users" className="text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
                                        <FiChevronLeft /> Back to Users
                                    </Link>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                    Orders for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{filteredUserName}</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <p className="text-slate-500 font-medium text-sm">Showing transaction history.</p>
                                    <Link
                                        to="/admin/orders"
                                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide transition-colors flex items-center gap-1.5"
                                    >
                                        <FiX size={12} /> Clear Filter
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                    Order <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Management</span>
                                </h1>
                                <p className="text-slate-500 font-medium text-sm">View and manage all customer transactions.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-white p-2 md:p-2.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 md:gap-3">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 md:py-2.5 rounded-xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 text-slate-900 placeholder-slate-400 text-sm font-bold transition-all"
                            placeholder="Search Order ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        {/* Time Filter Dropdown */}
                        <div className="relative w-full sm:w-auto min-w-[140px]">
                            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <select
                                value={timeFilter}
                                onChange={(e) => {
                                    setTimeFilter(e.target.value);
                                    if (e.target.value === 'custom') setShowCustomDate(true);
                                    else setShowCustomDate(false);
                                }}
                                className="w-full pl-9 pr-8 py-3 md:py-2.5 rounded-xl border-none bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-bold text-slate-600 uppercase transition-all appearance-none cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="all">All Time</option>
                                <option value="custom">Custom</option>
                            </select>
                            <FiChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 rotate-90 pointer-events-none" />
                        </div>

                        {/* Status Pills */}
                        <div className="flex bg-slate-50 p-1 rounded-xl gap-1 shrink-0 overflow-x-auto sleek-scrollbar">
                            {filters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterStatus(filter.value)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all whitespace-nowrap flex-1 sm:flex-none ${filterStatus === filter.value
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom Date Picker (kept separate as it's a transient UI) */}
                {showCustomDate && (
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2">
                        <div className="w-full sm:w-auto">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="block w-full text-xs font-bold border border-slate-200 rounded-lg px-2 py-2 mt-1 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="block w-full text-xs font-bold border border-slate-200 rounded-lg px-2 py-2 mt-1 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <button
                            onClick={() => setShowCustomDate(false)}
                            className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2 rounded-lg"
                        >
                            <FiX />
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            {orders && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Dynamic Orders Count */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                {timeFilter === 'today' ? "Today's Orders"
                                    : timeFilter === 'all' ? "Total Orders"
                                        : timeFilter === 'custom' ? "Custom Range Orders"
                                            : `Orders This ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`}
                            </p>
                            <h3 className="text-3xl font-black text-slate-900">
                                {orders?.filter(order => isWithinTimeFilter(order.createdAt)).length || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform duration-300">
                            <FiCalendar />
                        </div>
                    </div>

                    {/* Shipped Orders (Filtered) */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Shipped</p>
                            <h3 className="text-3xl font-black text-slate-900">
                                {orders?.filter(order => isWithinTimeFilter(order.createdAt) && order.status === 'Shipped').length || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform duration-300">
                            <FiTruck />
                        </div>
                    </div>

                    {/* Delivered Orders (Filtered) */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Delivered</p>
                            <h3 className="text-3xl font-black text-slate-900">
                                {orders?.filter(order => isWithinTimeFilter(order.createdAt) && order.isDelivered).length || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform duration-300">
                            <FiPackage />
                        </div>
                    </div>

                    {/* Cancelled Orders (Filtered) */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center justify-between group hover:scale-[1.02] transition-transform duration-300">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Cancelled</p>
                            <h3 className="text-3xl font-black text-red-500">
                                {orders?.filter(order => isWithinTimeFilter(order.createdAt) && order.status === 'Cancelled').length || 0}
                            </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform duration-300">
                            <FiX />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-pulse">
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between gap-4">
                            <div className="h-4 w-20 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded hidden md:block"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded hidden md:block"></div>
                            <div className="h-4 w-20 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                                <div className="w-16 h-6 bg-slate-200 rounded shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 md:w-32 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-1/2 md:w-40 bg-slate-200 rounded hidden sm:block"></div>
                                </div>
                                <div className="h-6 w-20 bg-slate-200 rounded hidden md:block"></div>
                                <div className="h-6 w-24 bg-slate-200 rounded-full hidden md:block"></div>
                                <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100 flex items-center gap-6 mb-10 animate-shake">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-3xl">
                        <FiX />
                    </div>
                    <div>
                        <p className="text-xl font-black mb-1">Error Loading Orders</p>
                        <p className="font-bold opacity-80">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                                    <th className="p-4 md:p-6 whitespace-nowrap">Order ID</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Customer</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Date</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Amount</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Payment</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Logistics</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {currentOrders && currentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 md:p-6">
                                            <span className="font-mono text-[10px] md:text-xs text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-lg">#{order._id.substring(18).toUpperCase()}</span>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <FiUser size={14} />
                                                </div>
                                                <span className="font-bold text-xs md:text-sm text-slate-900 whitespace-nowrap">{order.user ? order.user.name : 'Deleted User'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs md:text-sm whitespace-nowrap">
                                                <FiCalendar size={14} />
                                                {new Date(order.createdAt).toLocaleString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(order.totalPrice)}</span>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            {order.isPaid ? (
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> Paid
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(order.paidAt).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-6">
                                            {order.status === 'Cancelled' ? (
                                                <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ring-1 ring-red-100">
                                                    Cancelled
                                                </span>
                                            ) : order.isDelivered ? (
                                                <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ring-1 ring-indigo-100">
                                                    Delivered
                                                </span>
                                            ) : order.status === 'Shipped' ? (
                                                <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ring-1 ring-blue-100">
                                                    Shipped
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                                                    Processing
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <Link
                                                to={`/order/${order._id}`}
                                                state={{ from: '/admin/orders' }}
                                                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-primary transition-all shadow-lg shadow-slate-200 hover:shadow-primary/30 font-bold text-[10px] md:text-xs uppercase tracking-wide transform active:scale-95"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredOrders && filteredOrders.length > 0 && (
                        <div className="p-4 md:p-6 bg-white border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                            {/* Mobile Top Row: Rows per page & Page Count */}
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500">
                                    <span className="hidden md:inline">Rows per page:</span>
                                    <span className="md:hidden">Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={handleLimitChange}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-primary font-bold text-xs md:text-sm"
                                    >
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={75}>75</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Mobile Page Info */}
                                <span className="md:hidden text-xs font-bold text-slate-500 whitespace-nowrap">
                                    Page {currentPage} / {totalPages}
                                </span>
                            </div>

                            {/* Desktop Page Info */}
                            <span className="hidden md:inline text-sm font-bold text-slate-500 whitespace-nowrap md:absolute md:left-1/2 md:-translate-x-1/2">
                                Page {currentPage} of {totalPages}
                            </span>

                            {/* Navigation & Go To */}
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 z-10">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`p-1.5 md:p-2 rounded-lg transition-colors border ${currentPage === 1
                                            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePageInput(pageInput);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Go to</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={pageInput}
                                        onChange={(e) => setPageInput(e.target.value)}
                                        className="w-12 md:w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-xs md:text-sm font-bold text-slate-700 focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        Go
                                    </button>
                                </form>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`p-1.5 md:p-2 rounded-lg transition-colors border ${currentPage === totalPages
                                            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredOrders && filteredOrders.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner text-slate-300">
                                <FiFilter />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">No orders found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Try selecting a different filter status.</p>
                        </div>
                    )}
                </div>
            )
            }

            <style>
                {`
                    .sleek-scrollbar::-webkit-scrollbar {
                        height: 4px;
                    }
                    .sleek-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .sleek-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    .sleek-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                `}
            </style>
        </div >
    );
};

export default OrderListPage;
