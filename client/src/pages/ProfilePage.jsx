import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUrl';
import { FiPackage, FiTruck, FiCheck, FiX, FiUser, FiShoppingBag, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ProfilePage = () => {
    const dispatch = useDispatch();

    const { userInfo } = useSelector((state) => state.auth);
    const { orders, loading, error } = useSelector((state) => state.order);

    useEffect(() => {
        dispatch(getMyOrders());
    }, [dispatch]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8 border-b pb-4">My Account</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* User Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100 text-center sticky top-24">
                        <div className="w-24 h-24 bg-gradient-to-tr from-purple-200 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-primary">
                            {userInfo?.name?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{userInfo?.name}</h2>
                        <p className="text-slate-500 text-sm mb-6">{userInfo?.email}</p>

                        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-3 text-slate-700">
                                <FiUser className="text-primary" />
                                <span className="font-medium">Account Details</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <FiShoppingBag className="text-primary" />
                                <span className="font-medium">Total Orders: {orders?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="lg:col-span-3">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiPackage /> Order History
                    </h2>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
                    ) : orders && orders.length === 0 ? (
                        <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200">
                            <FiShoppingBag className="mx-auto text-4xl text-slate-300 mb-4" />
                            <p className="text-slate-500 mb-4">You haven't placed any orders yet.</p>
                            <Link to="/" className="text-primary font-bold hover:underline">Start Shopping</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <Link to={`/order/${order._id}`} key={order._id} state={{ from: '/profile' }} className="block">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md hover:border-primary/30 group"
                                    >
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4 border-b border-slate-100 pb-4">
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Order ID</p>
                                                <p className="font-mono text-slate-700">#{order._id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Date</p>
                                                <div className="flex items-center gap-1 text-slate-700">
                                                    <FiCalendar className="text-slate-400" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total</p>
                                                <p className="font-bold text-slate-900">{formatCurrency(order.totalPrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Status</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 w-fit ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {order.isPaid ? <FiCheck size={10} /> : <FiX size={10} />} {order.isPaid ? 'Paid' : (order.paymentMethod === 'CashOnDelivery' ? 'Cash on Delivery' : order.paymentMethod)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 w-fit ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                        order.isDelivered ? 'bg-green-100 text-green-700' :
                                                            (order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')
                                                        }`}>
                                                        {order.status === 'Cancelled' ? <FiX size={10} /> : (order.isDelivered ? <FiCheck size={10} /> : <FiTruck size={10} />)}
                                                        {order.status === 'Cancelled' ? 'Cancelled' : (order.isDelivered ? 'Delivered' : (order.status === 'Shipped' ? 'Shipped' : 'Processing'))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Preview */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex -space-x-3 overflow-hidden p-1">
                                                {order.orderItems.slice(0, 4).map((item, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={getImageUrl(item.image)}
                                                        alt={item.name}
                                                        className="inline-block h-12 w-12 rounded-full ring-2 ring-white object-cover bg-slate-50"
                                                        title={item.name}
                                                    />
                                                ))}
                                                {order.orderItems.length > 4 && (
                                                    <div className="h-12 w-12 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        +{order.orderItems.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm font-bold text-primary group-hover:text-purple-700 flex items-center gap-1 transition-colors">
                                                Details <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
