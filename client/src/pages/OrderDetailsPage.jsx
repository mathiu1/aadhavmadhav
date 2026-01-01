import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, deliverOrder, shipOrder, cancelOrder, resetOrderDeliver } from '../slices/orderSlice';
import { createReview, resetReviewState } from '../slices/productSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUrl';
import { generateInvoice } from '../utils/generateInvoice';
import { FiUser, FiMapPin, FiCreditCard, FiPackage, FiTruck, FiCheck, FiX, FiArrowLeft, FiAlertCircle, FiAlertTriangle, FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const OrderDetailsPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const dispatch = useDispatch();
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, type: null });
    const [reason, setReason] = useState('');

    // Review State
    const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null });
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const { userInfo } = useSelector((state) => state.auth);
    const { orderDetails, orderDeliver } = useSelector((state) => state.order);
    const { reviewLoading, reviewSuccess, reviewError } = useSelector((state) => state.product);

    const { loading, error, order } = orderDetails;
    const { loading: loadingDeliver, success: successDeliver } = orderDeliver;


    useEffect(() => {
        if (reviewSuccess) {
            setReviewModal({ isOpen: false, productId: null });
            setRating(5);
            setComment('');
            dispatch(resetReviewState());
            toast.success('Review added successfully');
        }
    }, [reviewSuccess, dispatch]);

    const submitReview = () => {
        if (rating && comment) {
            dispatch(createReview({
                productId: reviewModal.productId,
                review: { rating, comment }
            }));
        } else {
            alert('Please select a rating and write a comment.');
        }
    };

    const handleActionClick = (type) => {
        setReason(''); // Reset reason
        setConfirmationModal({ isOpen: true, type });
    };

    const confirmAction = () => {
        if (confirmationModal.type === 'ship') {
            dispatch(shipOrder(order._id));
        } else if (confirmationModal.type === 'deliver') {
            dispatch(deliverOrder(order._id));
        } else if (confirmationModal.type === 'cancel') {
            dispatch(cancelOrder({ id: order._id, reason }));
        }
        setConfirmationModal({ isOpen: false, type: null });
    };

    useEffect(() => {
        if (!order || successDeliver || order._id !== id) {
            dispatch(resetOrderDeliver());
            dispatch(getOrderDetails(id));
        }
    }, [dispatch, id, successDeliver, order]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 relative animate-pulse">
                <div className="h-6 w-32 bg-slate-200 rounded mb-8"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-24 bg-slate-200 rounded"></div>
                            <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        </div>
                        <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                            </div>
                            <div className="p-6 space-y-6">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <div className="h-5 w-20 bg-slate-200 rounded ml-auto"></div>
                                            <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl p-6 h-48 bg-slate-100"></div>
                            <div className="bg-white rounded-2xl p-6 h-48 bg-slate-100"></div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><div className="h-4 w-20 bg-slate-200 rounded"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                                <div className="flex justify-between"><div className="h-4 w-20 bg-slate-200 rounded"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                                <div className="flex justify-between"><div className="h-4 w-20 bg-slate-200 rounded"></div><div className="h-4 w-16 bg-slate-200 rounded"></div></div>
                            </div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div className="flex justify-between"><div className="h-6 w-24 bg-slate-200 rounded"></div><div className="h-6 w-24 bg-slate-200 rounded"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                    <FiAlertCircle className="mx-auto text-4xl text-red-500 mb-3" />
                    <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Order</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link to="/profile" className="text-primary font-bold hover:underline">Back to My Orders</Link>
                </div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 relative">
            <Link to={location.state?.from || (userInfo && userInfo.isAdmin ? "/admin/orders" : "/profile")} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary font-medium mb-6 transition-colors">
                <FiArrowLeft /> Back to {location.state?.from?.includes('admin') ? 'Orders' : 'My Orders'}
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                        <span>Order</span>
                        <span className="text-slate-400 font-mono text-xl">#{order._id}</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                        <span className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.isPaid ? <FiCheck /> : <FiAlertCircle />} {order.isPaid ? 'Paid' : (order.paymentMethod === 'CashOnDelivery' ? 'Cash on Delivery' : order.paymentMethod)}
                        </span>
                        <span className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            order.isDelivered ? 'bg-indigo-100 text-indigo-700' :
                                (order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')
                            }`}>
                            {order.status === 'Cancelled' ? <FiX /> : (order.isDelivered ? <FiCheck /> : <FiTruck />)}
                            {order.status === 'Cancelled' ? 'Cancelled' : (order.isDelivered ? 'Delivered' : (order.status === 'Shipped' ? 'Shipped' : 'Processing'))}
                        </span>
                    </div>
                </div>
            </div>

            {order.status === 'Cancelled' && (
                <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                        <FiAlertTriangle />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900">Order Cancelled</h3>
                        <p className="text-red-700 text-sm mt-1">Reason: <span className="font-semibold">{order.cancellationReason || 'No reason provided'}</span></p>
                        <p className="text-red-400 text-xs mt-2">Cancelled on {new Date(order.cancelledAt).toLocaleString()}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Order Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <FiPackage className="text-slate-400" />
                            <h2 className="font-bold text-slate-700">Order Items</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {order.orderItems.map((item, index) => {
                                const productObj = item.product;
                                const isHardDeleted = productObj === null;
                                const isSoftDeleted = productObj && productObj.isDeleted;
                                const isInactive = isHardDeleted || isSoftDeleted;
                                const productId = productObj && productObj._id ? productObj._id : item.product;

                                return (
                                    <div key={index} className="p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-20 h-20 bg-white rounded-xl border border-slate-100 p-2 flex-shrink-0 grayscale-[50%]">
                                            <img src={getImageUrl(item.image)} alt={item.name} className={`w-full h-full object-contain ${isInactive ? 'opacity-50' : ''}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isInactive ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-slate-400 cursor-not-allowed truncate">
                                                        {item.name}
                                                    </span>
                                                    <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                                                        Item Unavailable
                                                    </span>
                                                </div>
                                            ) : (
                                                <Link to={`/product/${productId}`} className="text-lg font-bold text-slate-800 hover:text-primary transition-colors block truncate">
                                                    {item.name}
                                                </Link>
                                            )}
                                            <p className="text-slate-500 mt-1">Quantity: {item.qty}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-slate-900">{formatCurrency(item.price * item.qty)}</p>
                                            <p className="text-sm text-slate-400">{formatCurrency(item.price)} each</p>

                                            {/* Review Button - Only if delivered and product exists (not tough deleted) */}
                                            {order.isDelivered && !isHardDeleted && (
                                                <button
                                                    onClick={() => setReviewModal({ isOpen: true, productId: productId })}
                                                    className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 justify-end ml-auto"
                                                >
                                                    <FiStar className="fill-indigo-600" /> Write a Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shipping & Payment Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Shipping Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <FiMapPin className="text-xl" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Shipping Address</h3>
                            </div>
                            <p className="font-bold text-slate-800 text-lg mb-1">{order.shippingAddress.name}</p>
                            <div className="text-slate-600 space-y-1 text-sm">
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                                <p>{order.shippingAddress.country}</p>
                                <p className="mt-2 text-slate-500">Phone: {order.shippingAddress.phone}</p>
                            </div>

                            {userInfo && userInfo.isAdmin && order.user && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <FiUser className="text-lg" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider">User Account</h3>
                                    </div>
                                    <p className="font-bold text-slate-800">{order.user.name}</p>
                                    <a href={`mailto:${order.user.email}`} className="text-sm text-primary hover:underline">{order.user.email}</a>
                                </div>
                            )}

                            {order.status === 'Cancelled' ? (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiX /> Order Cancelled
                                </div>
                            ) : order.isDelivered ? (
                                <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiCheck /> Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                                </div>
                            ) : order.status === 'Shipped' ? (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiTruck /> Order Shipped
                                </div>
                            ) : (
                                <div className="mt-4 p-3 bg-slate-50 text-slate-500 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiPackage /> Processing
                                </div>
                            )}
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <FiCreditCard className="text-xl" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Payment Method</h3>
                            </div>
                            <p className="font-bold text-slate-800 text-lg mb-4">{order.paymentMethod}</p>

                            {order.isPaid ? (
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiCheck /> Paid on {new Date(order.paidAt).toLocaleDateString()}
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <FiAlertCircle /> {order.paymentMethod === "Cash on Delivery" ? 'Pay on Delivery' : 'Payment Pending'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>Items Subtotal</span>
                                <span>{formatCurrency(order.itemsPrice)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{formatCurrency(order.shippingPrice)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax</span>
                                <span>{formatCurrency(order.taxPrice)}</span>
                            </div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div className="flex justify-between text-xl font-bold text-slate-900">
                                <span>Total</span>
                                <span>{formatCurrency(order.totalPrice)}</span>
                            </div>
                        </div>

                        {/* Action Buttons (For Admin or Future functionality like Cancel/Return) */}
                        <div className="space-y-3">
                            {order.isDelivered && (
                                <button
                                    onClick={() => generateInvoice(order)}
                                    className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Download Invoice
                                </button>
                            )}
                            <Link to="/support" className="block w-full text-center py-3 text-sm text-primary font-bold hover:underline">
                                Need Help?
                            </Link>
                        </div>

                        {/* Admin Actions */}
                        {userInfo && userInfo.isAdmin && !order.isDelivered && order.status !== 'Cancelled' && (
                            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                                {order.status === 'Processing' && (
                                    <button
                                        onClick={() => handleActionClick('ship')}
                                        className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                        disabled={loadingDeliver}
                                    >
                                        {loadingDeliver ? 'Processing...' : 'Mark As Shipped'}
                                    </button>
                                )}

                                {order.status === 'Shipped' && (
                                    <button
                                        onClick={() => handleActionClick('deliver')}
                                        className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                        disabled={loadingDeliver}
                                    >
                                        {loadingDeliver ? 'Processing...' : 'Mark As Delivered'}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleActionClick('cancel')}
                                    className="w-full py-3 rounded-lg border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition-colors"
                                    disabled={loadingDeliver}
                                >
                                    Cancel Order
                                </button>

                                {order.status === 'Shipped' && (
                                    <p className="text-[10px] text-center text-slate-400 font-medium italic">
                                        Marking as delivered will decrease product stock.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmationModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className={`w-12 h-12 rounded-full ${confirmationModal.type === 'cancel' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center text-xl mb-4 mx-auto`}>
                            {confirmationModal.type === 'cancel' ? <FiX /> : <FiAlertTriangle />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                            {confirmationModal.type === 'cancel' ? 'Cancel Order' : 'Confirm Action'}
                        </h3>
                        <p className="text-slate-500 text-center mb-6 text-sm">
                            {confirmationModal.type === 'cancel'
                                ? 'Are you sure you want to cancel this order? This action cannot be undone.'
                                : <>Are you sure you want to mark this order as <span className="font-bold text-slate-900 mx-1">{confirmationModal.type === 'ship' ? 'Shipped' : 'Delivered'}</span>?</>
                            }

                            {confirmationModal.type === 'deliver' && (
                                <span className="block mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    This action is irreversible and will update inventory.
                                </span>
                            )}
                        </p>

                        {confirmationModal.type === 'cancel' && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Cancellation Reason</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Out of stock, Customer request"
                                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none h-24"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmationModal({ isOpen: false, type: null })}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={confirmationModal.type === 'cancel' && !reason.trim()}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg ${confirmationModal.type === 'cancel'
                                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                                    }`}
                            >
                                {confirmationModal.type === 'cancel' ? 'Cancel Order' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Review Modal */}
            {reviewModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Write a Review</h3>
                            <button onClick={() => setReviewModal({ isOpen: false, productId: null })} className="text-slate-400 hover:text-slate-600">
                                <FiX size={24} />
                            </button>
                        </div>

                        {reviewError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {reviewError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setRating(val)}
                                        className={`text-2xl transition-colors ${val <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                                    >
                                        <FaStar />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Review</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="4"
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                                placeholder="Share your experience..."
                            ></textarea>
                        </div>

                        <button
                            onClick={submitReview}
                            disabled={reviewLoading || !comment.trim()}
                            className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reviewLoading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsPage;
