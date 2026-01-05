import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiPhone, FiPhoneIncoming, FiPhoneMissed, FiPhoneOutgoing, FiClock, FiUser, FiCheckCircle, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPagination from '../../components/AdminPagination';

const CallHistoryPage = () => {
    const [calls, setCalls] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState('today'); // all, today, week, month, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, missed, ongoing, completed, rejected

    useEffect(() => {
        setPage(1); // Reset to page 1 when filters change
    }, [filterDate, statusFilter, startDate, endDate, pageSize]);

    useEffect(() => {
        fetchCalls();
        fetchStats();
    }, [page, filterDate, statusFilter, startDate, endDate, pageSize]);

    const fetchCalls = async () => {
        setLoading(true);
        try {
            // Build Query Params
            const params = new URLSearchParams({
                pageNumber: page,
                pageSize: pageSize, // Pass dynamic page size
                status: statusFilter,
                filterDate: filterDate
            });
            if (filterDate === 'custom' && startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            const { data } = await api.get(`/calls?${params.toString()}`);
            setCalls(data.calls);
            setPages(data.pages);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch calls');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/calls/missed');
            setStats(data);
        } catch (error) {
            console.error(error);
        }
    };

    const markMissedAsRead = async () => {
        try {
            await api.put('/calls/missed/mark-read');
            fetchStats();
            toast.success("Missed calls marked as checked");
        } catch (error) {
            console.error(error);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}m ${sec}s`;
    };

    const totalMissed = stats.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Call <span className="text-primary italic">Support</span> History</h1>

                {/* Global Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-sm cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {filterDate === 'custom' && (
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 outline-none bg-transparent"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-2xl">
                            <FiPhoneMissed />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Missed Calls</p>
                            <p className="text-3xl font-black text-slate-900">
                                {totalMissed}
                            </p>
                        </div>
                    </div>
                    {totalMissed > 0 && (
                        <button
                            onClick={markMissedAsRead}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-colors"
                            title="Mark all as viewed"
                        >
                            <FiCheckCircle size={18} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
                {/* Additional Stats can be added here */}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <FiClock className="text-primary" /> Recent Calls
                    </h2>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-xs uppercase tracking-wide cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="missed">Missed</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                <th className="p-6">Status</th>
                                <th className="p-6">Caller</th>
                                <th className="p-6">Receiver</th>
                                <th className="p-6">Date & Time</th>
                                <th className="p-6">Duration</th>
                                <th className="p-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-20 text-center font-bold text-slate-400 animate-pulse">Loading call history...</td></tr>
                            ) : calls.length === 0 ? (
                                <tr><td colSpan="6" className="p-20 text-center font-bold text-slate-400">No calls found fitting the criteria.</td></tr>
                            ) : (
                                calls.map((call) => (
                                    <tr key={call._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            {call.status === 'missed' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200"><FiPhoneMissed /> Missed</span>}
                                            {call.status === 'ongoing' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600 border border-blue-200"><FiPhoneIncoming className="animate-pulse" /> Ongoing</span>}
                                            {call.status === 'completed' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200"><FiCheckCircle /> Completed</span>}
                                            {call.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"><FiPhoneMissed /> Rejected</span>}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <FiUser />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900">{call.caller?.name || 'Unknown'}</p>
                                                        {call.caller && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${call.caller.isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {call.caller.isAdmin ? 'Admin' : 'Customer'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400">{call.caller?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 group-hover:bg-purple-100 transition-colors">
                                                    <FiUser />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900">{call.receiver?.name || 'Support Team'}</p>
                                                        {call.receiver && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${call.receiver.isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {call.receiver.isAdmin ? 'Admin' : 'Customer'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400">{call.receiver?.email || 'System'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-bold text-slate-600">
                                            {new Date(call.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-6 font-bold text-slate-900">
                                            {formatDuration(call.duration)}
                                        </td>
                                        <td className="p-6">
                                            <button className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-purple-200">
                                                <FiPhone className="text-lg" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Admin Pagination */}
                {pages > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <AdminPagination
                            page={page}
                            pages={pages}
                            pageSize={pageSize}
                            setPage={setPage}
                            setPageSize={setPageSize}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistoryPage;
