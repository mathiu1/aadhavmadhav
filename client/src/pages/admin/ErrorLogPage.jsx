import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listErrorLogs, deleteErrorLog, clearErrorLogs, markErrorsRead } from '../../slices/errorLogSlice';
import { FiTrash2, FiAlertCircle, FiSearch, FiMonitor, FiServer, FiMessageSquare, FiX, FiCode } from 'react-icons/fi';
import AdminPagination from '../../components/AdminPagination';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

const BuggyComponent = () => {
    throw new Error("This is a simulated CLIENT error for testing purposes!");
};

const ErrorLogPage = () => {
    const dispatch = useDispatch();
    const { logs, loading, error, page, pages } = useSelector((state) => state.errorLogs);

    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [stackModal, setStackModal] = useState({ isOpen: false, log: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });
    const [shouldCrash, setShouldCrash] = useState(false);

    useEffect(() => {
        dispatch(listErrorLogs({ pageNumber }));
        dispatch(markErrorsRead()); // Mark logs as read when viewing
    }, [dispatch, pageNumber]);

    const handleDelete = (id) => {
        setDeleteModal({ isOpen: true, type: 'single', id });
    };

    const handleClearAll = () => {
        setDeleteModal({ isOpen: true, type: 'all', id: null });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'single') {
            dispatch(deleteErrorLog(deleteModal.id));
            toast.success('Error log deleted');
        } else if (deleteModal.type === 'all') {
            dispatch(clearErrorLogs());
            toast.success('All logs cleared');
        }
        setDeleteModal({ isOpen: false, type: null, id: null });
    };

    const openStackModal = (log) => {
        setStackModal({ isOpen: true, log });
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Error Logs</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Monitor application health and user feedback.</p>
                </div>
                <button
                    onClick={handleClearAll}
                    disabled={logs.length === 0}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-black hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <FiTrash2 /> Clear All Logs
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
                    <FiAlertCircle size={24} />
                    <span className="font-bold">{error}</span>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-12 text-center text-slate-400">
                    <FiAlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-slate-600">No Errors Found</h3>
                    <p>The system is running smoothly.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                                    <th className="p-4 md:p-6 whitespace-nowrap">Source</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Status/Method</th>
                                    <th className="p-4 md:p-6">Message</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">User</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Time</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 md:p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${log.source === 'server'
                                                ? 'bg-purple-50 text-purple-600'
                                                : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {log.source === 'server' ? <FiServer /> : <FiMonitor />}
                                                {log.source.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <div className="flex flex-col gap-1">
                                                {log.statusCode && (
                                                    <span className={`text-xs font-black ${log.statusCode >= 500 ? 'text-red-500' : 'text-orange-500'
                                                        }`}>
                                                        {log.statusCode}
                                                    </span>
                                                )}
                                                {log.method && (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md self-start">
                                                        {log.method}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 max-w-md">
                                            <p className="text-sm font-bold text-slate-800 line-clamp-2" title={log.message}>
                                                {log.message}
                                            </p>
                                            <p className="text-xs text-slate-400 font-mono mt-1 truncate" title={log.path}>
                                                {log.path}
                                            </p>
                                            {log.feedback && (
                                                <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 p-2 rounded-lg border border-yellow-100 flex gap-2 items-start">
                                                    <FiMessageSquare className="shrink-0 mt-0.5" />
                                                    <span className="font-medium">"{log.feedback}"</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-6 whitespace-nowrap">
                                            {log.user ? (
                                                <div className="text-xs">
                                                    <p className="font-bold text-slate-700">{log.user.name}</p>
                                                    <p className="text-slate-400">{log.user.email}</p>
                                                </div>
                                            ) : (
                                                <div className="text-xs">
                                                    <span className="text-slate-400 font-bold">Guest / System</span>
                                                    {log.userAgent && (
                                                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]" title={log.userAgent}>
                                                            {log.userAgent}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {log.ip && <p className="text-[10px] text-slate-300 mt-1" title="IP Address">{log.ip}</p>}
                                        </td>
                                        <td className="p-4 md:p-6 whitespace-nowrap text-xs text-slate-500 font-medium">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openStackModal(log)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                                                    title="View Stack Trace"
                                                >
                                                    <FiCode size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(log._id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Log"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <AdminPagination
                        page={page}
                        pages={pages}
                        pageSize={pageSize}
                        setPage={setPageNumber}
                        setPageSize={setPageSize}
                        pageSizeOptions={[20, 50, 100]}
                    />
                </div>
            )}

            {/* Stack Trace Modal */}
            {stackModal.isOpen && stackModal.log && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setStackModal({ isOpen: false, log: null })}>
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-slate-800">Error Details</h3>
                            <button onClick={() => setStackModal({ isOpen: false, log: null })} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto font-mono text-xs md:text-sm">
                            <div className="mb-6">
                                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">Message</h4>
                                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-bold">
                                    {stackModal.log.message}
                                </div>
                            </div>

                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stackModal.log.user && (
                                    <div>
                                        <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">User</h4>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="font-bold text-slate-700">{stackModal.log.user.name}</p>
                                            <p className="text-slate-500 text-xs">{stackModal.log.user.email}</p>
                                        </div>
                                    </div>
                                )}
                                <div className={!stackModal.log.user ? 'md:col-span-2' : ''}>
                                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">Environment</h4>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${stackModal.log.source === 'server' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {stackModal.log.source}
                                            </span>
                                            <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                {stackModal.log.method || 'N/A'} {stackModal.log.path}
                                            </span>
                                        </div>
                                        {stackModal.log.userAgent && (
                                            <div className="pt-2 border-t border-slate-200">
                                                <span className="font-bold text-slate-400 block mb-1 text-[10px] uppercase">User Agent</span>
                                                <p className="text-slate-500 font-mono break-all">{stackModal.log.userAgent}</p>
                                            </div>
                                        )}
                                        {stackModal.log.ip && (
                                            <div className="pt-1">
                                                <span className="text-slate-400">IP: </span>
                                                <span className="text-slate-600 font-mono">{stackModal.log.ip}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-2">Stack Trace</h4>
                                <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                                    {stackModal.log.stack || 'No stack trace available.'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiTrash2 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {deleteModal.type === 'all' ? 'Clear All Logs?' : 'Delete Log?'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            {deleteModal.type === 'all'
                                ? 'Are you sure you want to remove ALL error logs? This action cannot be undone.'
                                : 'Are you sure you want to remove this error log?'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02]"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ErrorLogPage;
