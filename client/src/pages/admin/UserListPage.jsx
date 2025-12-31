import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listUsers, deleteUser, incrementMessageCount, decrementMessageCount, resetMessageCount } from '../../slices/userSlice';
import { FiTrash2, FiEdit, FiCheck, FiX, FiUsers, FiMail, FiShield, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiPackage, FiShoppingCart, FiClock, FiMessageSquare, FiHeart } from 'react-icons/fi';
import { useSocketContext } from '../../context/SocketContext';
import ChatWindow from '../../components/ChatWindow';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageUrl';

const UserListPage = () => {
    const dispatch = useDispatch();
    const { onlineUsers, socket } = useSocketContext();
    const [keyword, setKeyword] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [pageInput, setPageInput] = useState('1');

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState(null);

    // Chat Modal State
    const [activeChatUser, setActiveChatUser] = useState(null);

    // Items Details Modal State
    const [itemModal, setItemModal] = useState({ isOpen: false, type: 'cart', userId: null });
    const [modalItems, setModalItems] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Use local state for debounced search
    const [searchTerm, setSearchTerm] = useState('');

    const { users, loading, error, page, pages } = useSelector((state) => state.user);
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', (msg) => {
                const senderId = msg.sender._id || msg.sender;
                if (userInfo && senderId !== userInfo._id) {
                    dispatch(incrementMessageCount(senderId));
                }
            });

            socket.on('messagesRead', ({ userId }) => {
                dispatch(resetMessageCount(userId));
            });

            socket.on('messageDeleted', (payload) => {
                const isObj = typeof payload === 'object' && payload !== null;
                // const id = isObj ? payload.id : payload; // Not needed here
                const isUnread = isObj ? payload.isUnread : false;
                const senderId = isObj ? payload.sender : null;

                if (isUnread && senderId && userInfo && senderId !== userInfo._id) {
                    dispatch(decrementMessageCount(senderId));
                }
            });

            return () => {
                socket.off('newMessage');
                socket.off('messagesRead');
                socket.off('messageDeleted');
            };
        }
    }, [socket, dispatch, userInfo]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setKeyword(searchTerm);
            setPageNumber(1); // Reset to page 1 on new search
            setPageInput('1');
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        dispatch(listUsers({ keyword, pageNumber, pageSize }));
    }, [dispatch, keyword, pageNumber, pageSize]);

    const deleteHandler = (id) => {
        setDeleteUserId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deleteUserId) {
            dispatch(deleteUser(deleteUserId));
            setShowDeleteModal(false);
            setDeleteUserId(null);
        }
    };

    const openItemsModal = async (userId, type) => {
        setItemModal({ isOpen: true, type, userId });
        setModalLoading(true);
        try {
            const { data } = await api.get(`/users/${userId}`, { withCredentials: true });
            if (type === 'cart') {
                setModalItems(data.cartItems || []);
            } else {
                setModalItems(data.favorites || []);
            }
        } catch (err) {
            console.error(err);
            setModalItems([]);
        } finally {
            setModalLoading(false);
        }
    };

    const [filterStatus, setFilterStatus] = useState('all'); // all, admin, customer

    // Client-side role filtering (on current page)
    const filteredUsers = users?.filter(user => {
        // Hide AdminBot
        if (user.email === 'bot@aadhavmadhav.com') return false;

        if (filterStatus === 'all') return true;
        if (filterStatus === 'admin') return user.isAdmin;
        if (filterStatus === 'customer') return !user.isAdmin;
        return true;
    });

    const filters = [
        { label: 'All Users', value: 'all' },
        { label: 'Administrators', value: 'admin' },
        { label: 'Customers', value: 'customer' },
    ];

    const formatLastSeen = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const closeChatHandler = () => {
        setActiveChatUser(null);
        dispatch(listUsers({ keyword, pageNumber, pageSize }));
    };

    const handlePageInput = (val) => {
        const pageNum = Number(val);
        if (pageNum >= 1 && pageNum <= pages) {
            setPageNumber(pageNum);
        } else {
            setPageInput(String(pageNumber));
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-10 pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            User <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Directory</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Manage permissions and view customer accounts.</p>
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
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        {/* Role Pills */}
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
            </div>

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
                        <FiX />
                    </div>
                    <div>
                        <p className="text-xl font-black mb-1">Error Loading Users</p>
                        <p className="font-bold opacity-80">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                                    <th className="p-4 md:p-6 whitespace-nowrap">User Profile</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Delivered Orders</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Messages</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Role</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Favorites</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Cart Items</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 md:p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center font-black text-primary border border-white group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all transform group-hover:scale-105 duration-300 min-w-[2.5rem] md:min-w-[3rem]">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight group-hover:text-primary transition-colors text-xs md:text-sm line-clamp-1">{user.name}</p>
                                                    <a href={`mailto:${user.email} `} className="text-[10px] md:text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 hover:text-primary transition-colors">
                                                        <FiMail size={12} /> {user.email}
                                                    </a>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <div className={`w - 1.5 h - 1.5 rounded - full ${onlineUsers.includes(user._id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-300'} `}></div>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {onlineUsers.includes(user._id) ? 'Online now' : `Seen ${formatLastSeen(user.lastSeen)} `}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            {user.totalDeliveredOrders > 0 ? (
                                                <Link
                                                    to={`/admin/orders?user=${user._id}`}
                                                    className="flex items-center gap-2 group hover:opacity-80 transition-opacity cursor-pointer"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                        <FiPackage size={16} />
                                                    </div>
                                                    <span className="font-black text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-4 group-hover:decoration-primary group-hover:text-primary transition-all">
                                                        {user.totalDeliveredOrders}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <div className="flex items-center gap-2 opacity-60">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                                                        <FiPackage size={16} />
                                                    </div>
                                                    <span className="font-black text-slate-400">0</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <button
                                                onClick={() => setActiveChatUser(user)}
                                                className="flex items-center gap-2 group/chat hover:opacity-80 transition-opacity"
                                            >
                                                <div className={`w - 8 h - 8 rounded - lg flex items - center justify - center transition - all ${user.unreadMessageCount > 0 ? 'bg-red-50 text-red-500 border border-red-100 shadow-sm animate-pulse' : 'bg-slate-50 text-slate-400 group-hover/chat:bg-primary/10 group-hover/chat:text-primary'} `}>
                                                    <FiMessageSquare size={16} />
                                                </div>
                                                <span className={`font - black ${user.unreadMessageCount > 0 ? 'text-red-500' : 'text-slate-900 group-hover/chat:text-primary'} `}>
                                                    {user.unreadMessageCount > 0 ? `${user.unreadMessageCount} New` : 'Chat'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            {user.isAdmin ? (
                                                <span className="inline-flex items-center gap-2 bg-primary text-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-200">
                                                    <FiShield size={10} strokeWidth={3} /> Administrator
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase">
                                                    Customer
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <button
                                                onClick={() => openItemsModal(user._id, 'favorites')}
                                                className="flex items-center gap-2 group/fav hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!user.favoriteCount}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center group-hover/fav:bg-pink-100 transition-colors">
                                                    <FiHeart size={16} className={user.favoriteCount > 0 ? "fill-pink-500" : ""} />
                                                </div>
                                                <span className="font-black text-slate-900">{user.favoriteCount || 0}</span>
                                            </button>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <button
                                                onClick={() => openItemsModal(user._id, 'cart')}
                                                className="flex items-center gap-2 group/cart hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!user.cartItemCount}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover/cart:bg-indigo-100 transition-colors">
                                                    <FiShoppingCart size={16} />
                                                </div>
                                                <span className="font-black text-slate-900">{user.cartItemCount || 0}</span>
                                            </button>
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/user/${user._id}/edit`}
                                                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-primary/30"
                                                >
                                                    <FiEdit size={14} md:size={16} />
                                                </Link >
                                                <button
                                                    onClick={() => deleteHandler(user._id)}
                                                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/30"
                                                >
                                                    <FiTrash2 size={14} md:size={16} />
                                                </button>
                                            </div >
                                        </td >
                                    </tr >
                                ))}
                            </tbody >
                        </table >
                    </div>

                    {/* Pagination */}
                    {!loading && !error && users.length > 0 && (
                        <div className="p-4 md:p-6 bg-white border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                            {/* Mobile Top Row: Rows per page & Page Count */}
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500">
                                    <span className="hidden md:inline">Rows per page:</span>
                                    <span className="md:hidden">Rows:</span>
                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPageNumber(1);
                                            setPageInput('1');
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-primary font-bold text-xs md:text-sm"
                                    >
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                {/* Mobile Page Info */}
                                <span className="md:hidden text-xs font-bold text-slate-500 whitespace-nowrap">
                                    Page {page} / {pages}
                                </span>
                            </div>

                            {/* Desktop Page Info */}
                            <span className="hidden md:inline text-sm font-bold text-slate-500 whitespace-nowrap md:absolute md:left-1/2 md:-translate-x-1/2">
                                Page {page} of {pages}
                            </span>

                            {/* Navigation & Go To */}
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 z-10">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            const newPage = Math.max(pageNumber - 1, 1);
                                            setPageNumber(newPage);
                                            setPageInput(String(newPage));
                                        }}
                                        disabled={pageNumber === 1}
                                        className={`p-1.5 md:p-2 rounded-lg transition-colors border ${pageNumber === 1
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
                                        max={pages}
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
                                        onClick={() => {
                                            const newPage = Math.min(pageNumber + 1, pages);
                                            setPageNumber(newPage);
                                            setPageInput(String(newPage));
                                        }}
                                        disabled={pageNumber === pages}
                                        className={`p-1.5 md:p-2 rounded-lg transition-colors border ${pageNumber === pages
                                            ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl shadow-slate-900/20 border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                                    <FiTrash2 />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Delete User?</h3>
                                <p className="text-slate-500 font-medium mb-8">
                                    This action cannot be undone. All data associated with this user, including their reviews, will be permanently removed.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 py-4 rounded-2xl font-black text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all transform active:scale-95"
                                    >
                                        Delete User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Chat Modal */}
            {
                activeChatUser && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="relative w-full max-w-lg h-[80vh] md:h-[600px] bg-white rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                            <ChatWindow
                                conversationUserId={activeChatUser._id}
                                title={`Chat with ${activeChatUser.name}`}
                                isOpen={true}
                                isWidget={false}
                                onClose={closeChatHandler}
                                lastSeen={activeChatUser.lastSeen}
                            />
                        </div>
                        {/* Backdrop click to close */}
                        <div className="absolute inset-0 -z-10" onClick={closeChatHandler}></div>
                    </div>
                )
            }

            {/* Items Details Modal */}
            {
                itemModal.isOpen && (
                    <div
                        onClick={() => setItemModal({ ...itemModal, isOpen: false })}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
                        >

                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${itemModal.type === 'cart' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-500'}`}>
                                        {itemModal.type === 'cart' ? <FiShoppingCart size={24} /> : <FiHeart size={24} className="fill-pink-500" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">
                                            {itemModal.type === 'cart' ? 'Shopping Cart' : 'Wishlist'}
                                        </h3>
                                        <p className="text-sm font-bold text-slate-500">
                                            User's {itemModal.type === 'cart' ? 'saved items' : 'favorite products'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setItemModal({ ...itemModal, isOpen: false })}
                                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 sleek-scrollbar">
                                {modalLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="w-10 h-10 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                                    </div>
                                ) : modalItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            {itemModal.type === 'cart' ? <FiShoppingCart size={32} /> : <FiHeart size={32} />}
                                        </div>
                                        <p className="text-slate-500 font-bold">No items found in {itemModal.type}.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {modalItems.map((item, index) => {
                                            if (!item) return null;

                                            // Resolve Product Data
                                            // If Wishlist: item is the product.
                                            // If Cart: item is cart object, item.product is the populated product.
                                            let productData = item;
                                            if (itemModal.type === 'cart' && item.product && typeof item.product === 'object') {
                                                productData = item.product;
                                            }

                                            // Status Flags
                                            // Only trust productData for status.
                                            const isInactive = productData?.isDeleted;
                                            const isOutOfStock = !isInactive && (productData?.countInStock <= 0);
                                            const category = productData?.category || 'Product';

                                            // Display Values
                                            const displayImage = getImageUrl(item.image || productData?.image);
                                            const displayName = item.name || productData?.name || "Unknown Product";
                                            const displayPrice = item.price || productData?.price || 0;

                                            return (
                                                <div key={index} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group">
                                                    <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 relative">
                                                        <img
                                                            src={displayImage}
                                                            alt={displayName}
                                                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isInactive || isOutOfStock ? 'grayscale' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-bold text-slate-900 truncate mb-1 ${isInactive ? 'line-through text-slate-400' : ''}`}>{displayName}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-wider">
                                                                {category}
                                                            </span>

                                                            {isInactive ? (
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-500 uppercase tracking-wider">
                                                                    Inactive
                                                                </span>
                                                            ) : isOutOfStock ? (
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-orange-100 text-orange-500 uppercase tracking-wider">
                                                                    Out of Stock
                                                                </span>
                                                            ) : null}

                                                            {itemModal.type === 'cart' && (
                                                                <span className="text-xs font-bold text-slate-400">Qty: {item.qty}</span>
                                                            )}
                                                        </div>
                                                        <p className={`font-black ${isInactive ? 'text-slate-400' : 'text-primary'}`}>
                                                            {`₹${displayPrice.toLocaleString('en-IN')}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                                <span className="text-xs font-bold text-slate-400">
                                    Showing {modalItems.length} items
                                </span>
                            </div>
                        </div>
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

export default UserListPage;
