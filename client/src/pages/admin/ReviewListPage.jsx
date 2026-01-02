import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllReviewsAdmin, deleteReviewAdmin, resetAdminState } from '../../slices/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiTrash2, FiUser, FiStar, FiCalendar, FiBox, FiMessageSquare, FiAlertTriangle, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUrl';
import { toast } from 'react-hot-toast';

const ReviewListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pageInput, setPageInput] = useState(1);
    const [actionModal, setActionModal] = useState({ isOpen: false, productId: null, reviewId: null });

    const { adminReviews, adminReviewPage, adminReviewPages, adminReviewTotal, isLoading, deleteLoading, deleteSuccess, deleteError } = useSelector((state) => state.product);

    useEffect(() => {
        dispatch(fetchAllReviewsAdmin({ search: searchQuery, user: userFilter, pageNumber, pageSize }));
    }, [dispatch, searchQuery, userFilter, pageNumber, pageSize, deleteSuccess]);

    // Update pageInput when page changes
    useEffect(() => {
        setPageInput(adminReviewPage);
    }, [adminReviewPage]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPageNumber(1);
    }, [searchQuery, userFilter]);

    useEffect(() => {
        if (deleteSuccess) {
            toast.success('Review deleted successfully');
            setActionModal({ isOpen: false, productId: null, reviewId: null });
            dispatch(resetAdminState());
        }
    }, [deleteSuccess, dispatch]);

    useEffect(() => {
        if (deleteError) {
            toast.error(deleteError);
            dispatch(resetAdminState());
        }
    }, [deleteError, dispatch]);

    const handleDelete = (productId, reviewId) => {
        setActionModal({ isOpen: true, productId, reviewId });
    };

    const confirmDelete = () => {
        if (actionModal.productId && actionModal.reviewId) {
            dispatch(deleteReviewAdmin({ productId: actionModal.productId, reviewId: actionModal.reviewId }));
        }
    };

    const handleGoToPage = () => {
        const p = Number(pageInput);
        if (p >= 1 && p <= adminReviewPages) {
            setPageNumber(p);
        } else {
            setPageInput(adminReviewPage);
            toast.error(`Please enter a page between 1 and ${adminReviewPages}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Reviews</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Monitor and manage customer feedback.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                {/* Search Product */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Product Name..."
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 text-slate-900 placeholder-slate-400 text-sm font-bold transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter User */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by User Name..."
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 text-slate-900 placeholder-slate-400 text-sm font-bold transition-all"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
                </div>
            ) : adminReviews?.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <FiMessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Reviews Found</h3>
                    <p className="text-slate-500 text-sm">Try adjusting your search filters.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {adminReviews.map((review) => (
                            <div key={review.reviewId} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Product Info */}
                                    <div className="flex items-start gap-4 md:w-1/4 min-w-[200px]">
                                        <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                            <img
                                                src={getImageUrl(review.productImage)}
                                                alt={review.productName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=IMG' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{review.productName}</h4>
                                            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-slate-400">
                                                <FiCalendar size={12} />
                                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Content */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex items-center gap-1 bg-yellow-400 text-white px-2 py-1 rounded-md shadow-sm shadow-yellow-200">
                                                    <span className="text-xs font-black">★ {review.rating}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                                                    <span className="font-bold text-slate-800 text-sm">{review.userName}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{review.userEmail}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(review._id, review.reviewId)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-all"
                                                title="Delete Review"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-slate-600 text-sm font-medium pl-1">"{review.comment}"</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-4 text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPageNumber(1);
                                    }}
                                    className="bg-slate-50 border-none rounded-lg font-bold text-slate-700 py-1 pl-2 pr-8 focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <span>Page {adminReviewPage} of {adminReviewPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                                disabled={adminReviewPage === 1}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <FiChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 hidden sm:inline">Go to</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={adminReviewPages}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    className="w-16 bg-slate-50 border-none rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 p-2"
                                />
                                <button
                                    onClick={handleGoToPage}
                                    className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Go
                                </button>
                            </div>

                            <button
                                onClick={() => setPageNumber(p => Math.min(adminReviewPages, p + 1))}
                                disabled={adminReviewPage === adminReviewPages}
                                className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <FiChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4 text-red-500">
                                <FiAlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Delete Review?</h3>
                            <p className="text-slate-500 text-sm">
                                Are you sure you want to delete this review? This action cannot be undone and will affect the product's overall rating.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, productId: null, reviewId: null })}
                                className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteLoading}
                                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {deleteLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <FiTrash2 />}
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewListPage;
