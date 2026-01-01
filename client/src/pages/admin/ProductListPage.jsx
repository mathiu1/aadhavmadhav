import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct, createProduct, resetAdminState, restoreProduct } from '../../slices/productSlice';
import { FiEdit, FiTrash2, FiPlus, FiBox, FiTag, FiShoppingBag, FiLayers, FiFilter, FiCheck, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiRotateCcw, FiAlertOctagon } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';
import { getImageUrl } from '../../utils/imageUrl';

const ProductListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const pageNumber = params.pageNumber || 1;

    // Local State
    const [filterStatus, setFilterStatus] = useState('all'); // all, instock, outofstock
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageInput, setPageInput] = useState('1');
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, type: 'soft' }); // type: 'soft' | 'hard'
    const [undoState, setUndoState] = useState(null);

    const { products, isLoading, error, pages, page, deleteLoading, deleteSuccess, deleteError, createLoading, createSuccess, createProduct: createdProduct, createError } = useSelector((state) => state.product);
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(resetAdminState());
    }, [dispatch]);

    useEffect(() => {
        let interval;
        if (undoState && undoState.timeLeft > 0) {
            interval = setInterval(() => {
                setUndoState(prev => {
                    if (!prev) return null;
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        } else if (undoState && undoState.timeLeft === 0) {
            // Timer finished, execute the delete
            dispatch(deleteProduct({ id: undoState.id, force: true }));
            setUndoState(null);
        }
        return () => clearInterval(interval);
    }, [undoState, dispatch]);

    // Reset page on filter/search change
    useEffect(() => {
        setCurrentPage(1);
        setPageInput('1');
    }, [filterStatus, searchQuery, filterCategory]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    useEffect(() => {
        if (deleteSuccess) {
            setActionModal({ isOpen: false, id: null, type: 'soft' });
            dispatch(fetchProducts({ pageNumber, pageSize: 100, showAll: true }));
            dispatch(resetAdminState());
        }
    }, [dispatch, deleteSuccess, pageNumber]);

    useEffect(() => {
        if (deleteError) {
            setActionModal({ isOpen: false, id: null, type: 'soft' });
        }
    }, [deleteError]);

    useEffect(() => {
        dispatch(fetchProducts({ pageNumber, pageSize: 100, showAll: true }));
    }, [dispatch, userInfo, pageNumber, navigate]);

    const openActionModal = (id, type) => {
        setActionModal({ isOpen: true, id, type });
    };

    const handleRestore = (id) => {
        dispatch(restoreProduct(id)); // Immediate restore for better UX, or could confirm
    };

    const confirmAction = () => {
        if (actionModal.id) {
            if (actionModal.type === 'soft') {
                dispatch(deleteProduct(actionModal.id));
            } else if (actionModal.type === 'hard') {
                setUndoState({ id: actionModal.id, timeLeft: 30 });
                setActionModal({ isOpen: false, id: null, type: 'soft' });
            }
        }
    };

    // Derived filtering
    const categories = ['all', ...new Set(products?.map(p => p.category))];

    const filteredProducts = products?.filter(product => {
        // Hide item pending deletion
        if (undoState && undoState.id === product._id) return false;

        // 1. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchName = product.name.toLowerCase().includes(query);
            const matchId = product._id.toLowerCase().includes(query);
            if (!matchName && !matchId) return false;
        }

        // 2. Category Filter
        if (filterCategory !== 'all' && product.category !== filterCategory) return false;

        // 3. Status Filter
        if (filterStatus === 'all') return true;
        if (filterStatus === 'deactivated') return product.isDeleted;
        if (filterStatus === 'instock') return product.countInStock > 0;
        if (filterStatus === 'outofstock') return product.countInStock <= 0;
        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
    const paginatedProducts = filteredProducts?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageInput = (val) => {
        const pageNumber = Number(val);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        } else {
            setPageInput(String(currentPage));
        }
    };

    const filters = [
        { label: 'All Products', value: 'all' },
        { label: 'In Stock', value: 'instock' },
        { label: 'Out of Stock', value: 'outofstock' },
        { label: 'Deactivated', value: 'deactivated' },
    ];

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:gap-8 mb-8 md:mb-10 pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                            Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Inventory</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">Manage your catalog, stock, and pricing.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/product/add')}
                        className="bg-primary text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/30 hover:-translate-y-1 active:scale-95 text-sm w-full md:w-auto"
                    >
                        <FiPlus size={18} strokeWidth={3} /> Add Product
                    </button>
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
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        {/* Category Dropdown */}
                        <div className="relative w-full sm:w-auto min-w-[160px]">
                            <FiLayers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full pl-9 pr-8 py-3 md:py-2.5 rounded-xl border-none bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 text-xs font-bold text-slate-600 uppercase transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {categories.filter(c => c !== 'all').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
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
            </div>

            {deleteError && (() => {
                let errorContent = deleteError;
                let errorOrders = null;
                try {
                    const parsed = JSON.parse(deleteError);
                    if (parsed && parsed.orders) {
                        errorContent = parsed.message;
                        errorOrders = parsed.orders;
                    }
                } catch (e) {
                    // Not valid JSON, just show string
                }

                return (
                    <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] border border-red-100 flex flex-col gap-4 mb-6 animate-shake relative">
                        <button
                            onClick={() => dispatch(resetAdminState())}
                            className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                        <div className="flex items-start gap-4 pr-8">
                            <FiAlertTriangle className="text-xl shrink-0 mt-1" />
                            <div className="w-full">
                                <p className="font-bold text-sm leading-relaxed">{errorContent}</p>
                                {errorOrders && (
                                    <div className="mt-4 bg-white/50 rounded-xl p-4 border border-red-100/50">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-2">Blocking Orders</p>
                                        <div className="space-y-2 max-h-40 overflow-y-auto sleek-scrollbar pr-2">
                                            {errorOrders.map((ord, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg shadow-sm">
                                                    <span className="font-mono font-bold text-slate-600">#{ord.id.slice(-6).toUpperCase()}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ord.status === 'Processing' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {ord.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {createError && (
                <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] border border-red-100 flex items-center gap-4 mb-6">
                    <FiPlus className="text-xl" />
                    <p className="font-bold text-sm">{createError}</p>
                </div>
            )}

            {isLoading || deleteLoading ? (
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-pulse">
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="p-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                                <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 md:w-48 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-1/2 md:w-24 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-8 w-20 bg-slate-200 rounded-lg hidden md:block"></div>
                                <div className="h-6 w-16 bg-slate-200 rounded hidden md:block"></div>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-8 rounded-[2.5rem] border border-red-100">
                    <p className="font-bold">{error}</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[2px]">
                                    <th className="p-4 md:p-6 whitespace-nowrap">Product Info</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Category</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Price</th>
                                    <th className="p-4 md:p-6 whitespace-nowrap">Stock Status</th>
                                    <th className="p-4 md:p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {paginatedProducts.map((product) => (
                                    <tr key={product._id} className={`hover:bg-slate-50/50 transition-colors group ${product.isDeleted ? 'bg-red-50/20 grayscale-[50%]' : ''}`}>
                                        <td className="p-4 md:p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 group-hover:border-primary/20 transition-colors min-w-[3rem] md:min-w-[4rem]">
                                                    {product.image ? (
                                                        <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <FiBox className="text-slate-300 text-xl md:text-2xl" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight group-hover:text-primary transition-colors text-xs md:text-sm line-clamp-1">
                                                        {product.name}
                                                        {product.isDeleted && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Inactive</span>}
                                                    </p>
                                                    <span className="text-[10px] md:text-xs font-bold text-slate-400">ID: {product._id.substring(18).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] font-black uppercase">
                                                <FiTag size={10} /> {product.category}
                                            </span>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <span className="text-xs md:text-sm font-black text-slate-900">{formatCurrency(product.price)}</span>
                                        </td>
                                        <td className="p-4 md:p-6">
                                            <div className="flex flex-col items-start gap-2">
                                                {product.countInStock > 0 ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> In Stock
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 pl-3">{product.countInStock} units</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> Out of Stock
                                                    </span>
                                                )}

                                                {/* Delivered Count Badge */}
                                                <div className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1.5">
                                                    <FiCheck size={10} className="text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        Sold: <span className="text-slate-900">{product.deliveredOrderCount || 0}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {product.isDeleted ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(product._id)}
                                                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-emerald-500/30"
                                                            title="Restore"
                                                        >
                                                            <FiRotateCcw size={14} md:size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal(product._id, 'hard')}
                                                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-600/30"
                                                            title="Permanently Delete"
                                                        >
                                                            <FiAlertOctagon size={14} md:size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            to={`/admin/product/${product._id}/edit`}
                                                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-primary/30"
                                                        >
                                                            <FiEdit size={14} md:size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() => openActionModal(product._id, 'soft')}
                                                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/30"
                                                        >
                                                            <FiTrash2 size={14} md:size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && !error && filteredProducts?.length > 0 && (
                        <div className="p-4 md:p-6 bg-white border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

                            {/* Mobile Top Row: Rows per page & Page Count */}
                            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500">
                                    <span className="hidden md:inline">Rows per page:</span>
                                    <span className="md:hidden">Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                            setPageInput('1');
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-primary font-bold text-xs md:text-sm"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
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
                                        onClick={() => {
                                            const newPage = Math.max(currentPage - 1, 1);
                                            setCurrentPage(newPage);
                                            setPageInput(String(newPage));
                                        }}
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
                                        onClick={() => {
                                            const newPage = Math.min(currentPage + 1, totalPages);
                                            setCurrentPage(newPage);
                                            setPageInput(String(newPage));
                                        }}
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
                </div>
            )}

            {/* Action Confirmation Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className={`w-12 h-12 rounded-2xl ${actionModal.type === 'hard' ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-500'} flex items-center justify-center mb-4 mx-auto`}>
                            {actionModal.type === 'hard' ? <FiAlertOctagon size={24} /> : <FiTrash2 size={24} />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-2">
                            {actionModal.type === 'hard' ? 'Permanently Delete?' : 'Deactivate Product?'}
                        </h3>
                        <p className="text-slate-500 text-center text-sm mb-6">
                            {actionModal.type === 'hard'
                                ? 'WARNING: This will permanently delete the product AND its order history. This action cannot be undone.'
                                : 'This will hide the product from the store. You can restore it later from the trash.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, id: null, type: 'soft' })}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${actionModal.type === 'hard' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}
                            >
                                {deleteLoading ? 'Processing...' : (actionModal.type === 'hard' ? 'Delete Forever' : 'Deactivate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Undo Deletion Toast */}
            {undoState && (
                <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-8 md:bottom-8 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 md:min-w-[320px] relative overflow-hidden group border border-slate-700/50">
                        {/* Progress Bar Background */}
                        <div
                            className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(undoState.timeLeft / 30) * 100}%` }}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                                <span className="font-mono font-bold text-xs">{undoState.timeLeft}s</span>
                            </div>
                            <div className="flex flex-col">
                                <p className="font-bold text-sm leading-tight">Deletion Scheduled</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Permanent Action</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setUndoState(null)}
                            className="relative z-10 bg-white text-slate-900 hover:bg-emerald-400 hover:text-emerald-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-white/10"
                        >
                            Undo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductListPage;
