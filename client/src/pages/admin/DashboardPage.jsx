import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderSummary } from '../../slices/orderSlice';
import { Link } from 'react-router-dom';
import {
    FiBox,
    FiUsers,
    FiShoppingBag,
    FiDollarSign,
    FiAlertTriangle,
    FiTrendingUp,
    FiTrendingDown,
    FiCalendar,
    FiArrowUpRight,
    FiFilter,
    FiX,
    FiAward,
    FiBriefcase,
    FiUser
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { getImageUrl } from '../../utils/imageUrl';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { orderSummary } = useSelector((state) => state.order);
    const { data, loading, error } = orderSummary;

    // States
    const [activeView, setActiveView] = useState('sales');
    const [dateRange, setDateRange] = useState('week'); // week, month, year, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [topLimit, setTopLimit] = useState(5);
    const [validationError, setValidationError] = useState('');
    const [exporting, setExporting] = useState(false);

    // Export Modal States
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFilters, setExportFilters] = useState({
        period: 'week', // week, month, year, custom
        startDate: '',
        endDate: '',
        status: 'All',
        category: 'All',
        user: ''
    });

    useEffect(() => {
        if (dateRange !== 'custom') {
            dispatch(getOrderSummary({ range: dateRange }));
        }
    }, [dispatch, dateRange]);

    const handleCustomFilter = (e) => {
        e.preventDefault();
        setValidationError('');

        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                setValidationError('Start date cannot be after end date');
                return;
            }
            dispatch(getOrderSummary({ range: 'custom', startDate, endDate }));
            setShowCustomPicker(false);
        }
    };

    const toggleExportModal = () => {
        setShowExportModal(!showExportModal);
    };

    const handleExportFilterChange = (e) => {
        const { name, value } = e.target;
        setExportFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = async (e) => {
        if (e) e.preventDefault();
        try {
            setExporting(true);

            // Build Query Params
            const params = new URLSearchParams();
            if (exportFilters.period === 'custom') {
                if (!exportFilters.startDate || !exportFilters.endDate) {
                    toast.error('Please select start and end dates');
                    setExporting(false);
                    return;
                }
                params.append('startDate', exportFilters.startDate);
                params.append('endDate', exportFilters.endDate);
            } else {
                params.append('period', exportFilters.period);
            }

            if (exportFilters.status !== 'All') params.append('status', exportFilters.status);
            if (exportFilters.category !== 'All') params.append('category', exportFilters.category);
            if (exportFilters.user) params.append('user', exportFilters.user);

            const response = await api.get(`/orders/export?${params.toString()}`, {
                responseType: 'blob',
                withCredentials: true,
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from header if possible, or default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `report_${new Date().toISOString().split('T')[0]}.xls`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setExporting(false);
            setShowExportModal(false);
            toast.success('Report downloaded successfully');
        } catch (err) {
            setExporting(false);
            console.error(err);
            toast.error('Failed to export report');
        }
    };

    const formatTrend = (val) => {
        if (val === undefined || val === null) return null;
        return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    };

    return (
        <>
            <style>
                {`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
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
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-10 pt-4 md:pt-0">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Overview</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Monitoring business performance in real-time.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleExportModal}
                            disabled={exporting}
                            className="flex-1 md:flex-none justify-center bg-slate-900 text-white px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-sm disabled:opacity-70 disabled:cursor-wait"
                        >
                            {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <FiArrowUpRight strokeWidth={3} />}
                            <span className="whitespace-nowrap">{exporting ? 'Exporting...' : 'Export Report'}</span>
                        </button>
                    </div>
                </div>

                {/* Export Filter Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100">
                                <h3 className="text-xl font-black text-slate-800">Filter Export Data</h3>
                                <button onClick={toggleExportModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 md:p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
                                {/* Date Range */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Time Period</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {['week', 'month', 'year', 'all', 'custom'].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setExportFilters(prev => ({ ...prev, period: p }))}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all flex-grow sm:flex-grow-0 ${exportFilters.period === p
                                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p === 'all' ? 'All Time' : p}
                                            </button>
                                        ))}
                                    </div>
                                    {exportFilters.period === 'custom' && (
                                        <div className="flex flex-col md:flex-row gap-3 animate-in slide-in-from-top-2">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">Start Date</label>
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={exportFilters.startDate}
                                                    onChange={handleExportFilterChange}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">End Date</label>
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={exportFilters.endDate}
                                                    onChange={handleExportFilterChange}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Status */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Order Status</label>
                                    <select
                                        name="status"
                                        value={exportFilters.status}
                                        onChange={handleExportFilterChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Category</label>
                                    <select
                                        name="category"
                                        value={exportFilters.category}
                                        onChange={handleExportFilterChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Crackers">Crackers</option>
                                        <option value="Custom T-Shirts">Custom T-Shirts</option>
                                        <option value="Nuts">Nuts</option>
                                        <option value="General">General</option>
                                    </select>
                                </div>

                                {/* User Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Filter by User</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="user"
                                            value={exportFilters.user}
                                            onChange={handleExportFilterChange}
                                            placeholder="Search by Name or Email..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all decoration-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 md:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={toggleExportModal}
                                    className="flex-1 bg-slate-100 text-slate-600 px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="flex-1 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-wait flex justify-center items-center gap-2 whitespace-nowrap"
                                >
                                    {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <FiArrowUpRight strokeWidth={3} />}
                                    <span>Download Report</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100 flex items-center gap-6 mb-10 animate-shake">
                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-3xl">
                            <FiAlertTriangle />
                        </div>
                        <div>
                            <p className="text-xl font-black mb-1">Snapshot of error</p>
                            <p className="font-bold opacity-80">{error}</p>
                        </div>
                    </div>
                ) : data ? (
                    <div className="space-y-8">
                        {/* Premium Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <StatCard
                                title="Net Revenue"
                                value={formatCurrency(data.totalRevenue)}
                                icon={<FaRupeeSign />}
                                color="indigo"
                                trend={formatTrend(data.revenueGrowth)}
                                to="/admin/orders"
                            />
                            <StatCard
                                title="Total Orders"
                                value={data.ordersCount}
                                icon={<FiShoppingBag />}
                                color="emerald"
                                trend={formatTrend(data.ordersGrowth)}
                                to="/admin/orders"
                            />
                            <StatCard
                                title="Active Users"
                                value={data.usersCount}
                                icon={<FiUsers />}
                                color="blue"
                                trend={formatTrend(data.usersGrowth)}
                                to="/admin/users"
                            />
                            <StatCard
                                title="Inventory"
                                value={data.productsCount}
                                subValue={`${data.outOfStockProducts} Out of stock`}
                                icon={<FiBox />}
                                color="purple"
                                alert={data.outOfStockProducts > 0}
                                to="/admin/products"
                            />
                        </div>

                        {/* Standalone Filter Section */}
                        <div className="flex flex-col items-start gap-4 py-2">
                            <div className="w-full overflow-x-auto pb-4 sleek-scrollbar">
                                <div className="bg-white shadow-xl shadow-slate-200/40 border border-slate-100 p-1.5 rounded-2xl md:rounded-[2rem] flex items-center gap-1 w-max min-w-full md:min-w-0">
                                    {[
                                        { label: 'This Week', value: 'week' },
                                        { label: 'This Month', value: 'month' },
                                        { label: 'Yearly', value: 'year' },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            onClick={() => {
                                                setDateRange(item.value);
                                                setShowCustomPicker(false);
                                            }}
                                            className={`px-4 md:px-8 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-xl md:rounded-[1.25rem] transition-all duration-300 whitespace-nowrap ${dateRange === item.value && !showCustomPicker
                                                ? 'bg-slate-900 text-white shadow-lg'
                                                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setDateRange('custom');
                                            setShowCustomPicker(!showCustomPicker);
                                        }}
                                        className={`px-4 md:px-8 py-2 md:py-3 text-[10px] md:text-xs font-black rounded-xl md:rounded-[1.25rem] transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${showCustomPicker || dateRange === 'custom'
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <FiFilter size={14} /> Custom Range
                                    </button>
                                </div>
                            </div>

                            {/* Custom Date Picker Popover */}
                            {showCustomPicker && (
                                <div className="relative w-full max-w-2xl p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 flex flex-col md:flex-row md:items-end justify-center gap-4 md:gap-8 animate-in fade-in slide-in-from-top-6 duration-500">
                                    {validationError && (
                                        <div className="absolute -top-12 left-0 right-0 mx-auto w-max bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
                                            <FiAlertTriangle /> {validationError}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-3.5 text-sm font-bold text-slate-700 focus:ring-0 transition-all outline-none shadow-inner w-full"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:gap-3">
                                        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 ml-1">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-slate-50 border-2 border-transparent focus:border-primary/20 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-3.5 text-sm font-bold text-slate-700 focus:ring-0 transition-all outline-none shadow-inner w-full"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 md:mt-0">
                                        <button
                                            onClick={handleCustomFilter}
                                            className="flex-1 md:flex-none bg-slate-900 text-white px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-sm hover:bg-primary transition-all shadow-xl shadow-slate-200 active:scale-95 translate-y-[-2px]"
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={() => setShowCustomPicker(false)}
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                        >
                                            <FiX size={24} md:size={28} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full">
                            {/* Main Chart Card */}
                            <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100/60 overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 md:mb-12">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                                                {activeView === 'sales' ? 'Orders & Revenue' : 'User Growth'}
                                            </h2>
                                            <span className="bg-primary/10 text-primary text-[10px] md:text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                                {dateRange === 'custom' ? 'Custom Filter' : `Active: ${dateRange}`}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-xs md:text-sm font-bold max-w-md">
                                            {activeView === 'sales' ? 'Visualizing transaction volume and generated revenue.' : 'Tracking new registrations across the platform.'}
                                        </p>
                                    </div>

                                    <div className="flex bg-slate-50 p-1 rounded-xl md:rounded-2xl border border-slate-100 w-full lg:w-auto">
                                        <button
                                            onClick={() => setActiveView('sales')}
                                            className={`flex-1 lg:px-8 py-2 md:py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all duration-300 ${activeView === 'sales'
                                                ? 'bg-white shadow-lg text-slate-900'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            Sales Metrics
                                        </button>
                                        <button
                                            onClick={() => setActiveView('users')}
                                            className={`flex-1 lg:px-8 py-2 md:py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-all duration-300 ${activeView === 'users'
                                                ? 'bg-white shadow-lg text-primary'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            User Metrics
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[350px] md:h-[550px] w-full pr-2 md:pr-4 overflow-x-auto sleek-scrollbar">
                                    <div style={{ minWidth: `${Math.max((activeView === 'sales' ? data.salesData?.length : data.userData?.length) * 60 || 0, 700)}px`, height: '100%' }}>
                                        {activeView === 'sales' ? (
                                            data.salesData && data.salesData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                                    <ComposedChart
                                                        data={data.salesData}
                                                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                                            dy={25}
                                                        />
                                                        <YAxis
                                                            yAxisId="left"
                                                            orientation="left"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                                            allowDecimals={false}
                                                        />
                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                                            tickFormatter={(value) => formatCurrency(value)}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc', radius: 15 }}
                                                            contentStyle={{
                                                                borderRadius: '28px',
                                                                border: 'none',
                                                                boxShadow: '0 30px 60px -12px rgb(0 0 0 / 0.2)',
                                                                padding: '24px'
                                                            }}
                                                            itemStyle={{ fontSize: '15px', fontWeights: 900, padding: '5px 0' }}
                                                        />

                                                        <Bar
                                                            yAxisId="left"
                                                            dataKey="orders"
                                                            fill="#10b981"
                                                            radius={[8, 8, 8, 8]}
                                                            barSize={dateRange === 'year' ? 35 : 25}
                                                            name="Orders"
                                                        />

                                                        <Area
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#3b82f6"
                                                            strokeWidth={6}
                                                            fillOpacity={1}
                                                            fill="url(#colorRevenue)"
                                                            name="Revenue"
                                                            activeDot={{ r: 10, strokeWidth: 5, stroke: "#fff", fill: '#3b82f6', shadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}
                                                        />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyChart title="No sales recorded for this period" />
                                            )
                                        ) : (
                                            data.userData && data.userData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                                    <ComposedChart
                                                        data={data.userData}
                                                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                                                    >
                                                        <defs>
                                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                                                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.01} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                                            dy={25}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 800 }}
                                                            allowDecimals={false}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc', radius: 15 }}
                                                            contentStyle={{
                                                                borderRadius: '28px',
                                                                border: 'none',
                                                                boxShadow: '0 30px 60px -12px rgb(0 0 0 / 0.2)',
                                                                padding: '24px'
                                                            }}
                                                            itemStyle={{ fontSize: '15px', fontWeight: 900, padding: '5px 0' }}
                                                        />
                                                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="users"
                                                            stroke="#7c3aed"
                                                            strokeWidth={4}
                                                            fillOpacity={1}
                                                            fill="url(#colorUsers)"
                                                            name="New Registrations"
                                                            activeDot={{ r: 8, strokeWidth: 4, stroke: "#fff", fill: '#7c3aed' }}
                                                        />
                                                        <Bar
                                                            dataKey="loginVisits"
                                                            fill="#0ea5e9"
                                                            name="Member Visits"
                                                            radius={[6, 6, 0, 0]}
                                                            barSize={20}
                                                        />
                                                        <Bar
                                                            dataKey="guestVisits"
                                                            fill="#f59e0b"
                                                            name="Guest Visits"
                                                            radius={[6, 6, 0, 0]}
                                                            barSize={20}
                                                        />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <EmptyChart title="No user growth for this period" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Top Performers Section */}
                            <div className="flex justify-between items-center mb-6 mt-12">
                                <h2 className="text-2xl font-black text-slate-900">Performance Leaders</h2>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setTopLimit(5)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${topLimit === 5 ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Top 5
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTopLimit(10)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${topLimit === 10 ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Top 10
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Top Categories */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                                            <FiBriefcase />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue by</p>
                                            <h3 className="text-lg font-black text-slate-900">Category</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4 overflow-y-auto max-h-[400px] sleek-scrollbar pr-2">
                                        {data.topCategories && data.topCategories.length > 0 ? (
                                            data.topCategories.slice(0, topLimit).map((cat, index) => (
                                                <div key={cat._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${index < 3 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-bold text-slate-700 truncate">{cat._id}</span>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(cat.revenue)}</p>
                                                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{cat.qty} items</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 text-sm">No data available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Top Products */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                                            <FiAward />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Best Selling</p>
                                            <h3 className="text-lg font-black text-slate-900">Products</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4 overflow-y-auto max-h-[400px] sleek-scrollbar pr-2">
                                        {data.topProducts && data.topProducts.length > 0 ? (
                                            data.topProducts.slice(0, topLimit).map((prod, index) => (
                                                <div key={prod._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${index < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </span>
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                            <img src={getImageUrl(prod.image)} alt={prod.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-700 text-sm truncate" title={prod.name}>{prod.name}</p>
                                                            <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{formatCurrency(prod.price)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">
                                                            {prod.qty} Sold
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 text-sm">No data available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Top Users */}
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                                            <FiUser />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Top Spending</p>
                                            <h3 className="text-lg font-black text-slate-900">Customers</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4 overflow-y-auto max-h-[400px] sleek-scrollbar pr-2">
                                        {data.topUsers && data.topUsers.length > 0 ? (
                                            data.topUsers.slice(0, topLimit).map((user, index) => (
                                                <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${index < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {index + 1}
                                                        </span>
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                                            {user.name.substring(0, 2)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-700 text-sm truncate" title={user.name}>{user.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium truncate" title={user.email}>{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{formatCurrency(user.totalSpent)}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{user.orderCount} orders</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 text-sm">No data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
};

const StatCard = ({ title, value, icon, color, trend, subValue, alert, to }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
    };

    const Content = () => {
        const isNegative = trend && trend.includes('-');
        const trendColor = isNegative
            ? 'bg-red-50 text-red-600 border-red-100/50'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
        const TrendIcon = isNegative ? FiTrendingDown : FiTrendingUp;

        const isLongVal = value && value.toString().length > 12;

        return (
            <div className={`bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 md:hover:-translate-y-2 group h-full cursor-pointer`}>
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-2xl md:text-3xl ${colors[color]} border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-current/5`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`${trendColor} text-[9px] md:text-[10px] font-black px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg md:rounded-xl flex items-center gap-1 shadow-sm border`}>
                            <TrendIcon size={10} /> {trend}
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[1px] md:tracking-[2px] mb-1 md:mb-2">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`${isLongVal ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'} font-black text-slate-900 tracking-tight leading-none transition-all duration-300`}>{value}</h3>
                        {subValue && (
                            <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider ${alert ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (to) {
        return (
            <Link to={to} className="block h-full">
                <Content />
            </Link>
        );
    }

    return <Content />;
};

const EmptyChart = ({ title }) => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-inner mb-6">
            <FiBox className="text-5xl opacity-10" />
        </div>
        <p className="text-xl font-black text-slate-800">{title}</p>
        <p className="text-sm font-bold opacity-60 mt-1">Try adjusting your date filters or check back later.</p>
    </div>
);

export default DashboardPage;
