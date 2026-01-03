import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FiPhone, FiPhoneIncoming, FiPhoneMissed, FiPhoneOutgoing, FiClock, FiUser, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CallHistoryPage = () => {
    const [calls, setCalls] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCalls();
        fetchStats();
    }, [page]);

    const fetchCalls = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/calls?pageNumber=${page}`);
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
            <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Call <span className="text-primary italic">Support</span> History</h1>

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
                <div className="p-6 md:p-8 border-b border-slate-100">
                    <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                        <FiClock className="text-primary" /> Recent Calls
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                                <tr><td colSpan="6" className="p-8 text-center font-bold text-slate-400">Loading call history...</td></tr>
                            ) : calls.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center font-bold text-slate-400">No calls recorded.</td></tr>
                            ) : (
                                calls.map((call) => (
                                    <tr key={call._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6">
                                            {call.status === 'missed' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600"><FiPhoneMissed /> Missed</span>}
                                            {call.status === 'ongoing' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600"><FiPhoneIncoming className="animate-pulse" /> Ongoing</span>}
                                            {call.status === 'completed' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600"><FiPhoneIncoming /> Completed</span>}
                                            {call.status === 'rejected' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600"><FiPhoneMissed /> Rejected</span>}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
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
                                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-400">
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
                                            <button className="p-2 rounded-xl bg-primary text-white hover:bg-secondary transition-colors shadow-lg shadow-purple-200">
                                                <FiPhone className="text-lg" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Simplified */}
                {pages > 1 && (
                    <div className="p-6 flex justify-center gap-2">
                        {[...Array(pages).keys()].map(x => (
                            <button
                                key={x + 1}
                                onClick={() => setPage(x + 1)}
                                className={`w-10 h-10 rounded-xl font-bold transition-all ${page === x + 1 ? 'bg-primary text-white shadow-lg shadow-purple-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {x + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistoryPage;
