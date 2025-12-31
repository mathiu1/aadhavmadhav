import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CheckoutSteps from '../components/CheckoutSteps';
import { createOrder, resetOrder } from '../slices/orderSlice';
import { clearCartLocal } from '../slices/cartSlice';
import { formatCurrency } from '../utils/formatCurrency';

const PlaceOrderPage = () => {
    const navigate = useNavigate();
    const cart = useSelector((state) => state.cart);

    // Filter out OOS items and invalid items for the order
    const validItems = cart.cartItems.filter(item => !item.isOutOfStock && !item.stockProblem);

    // Calculate Prices based on validItems (not cart.cartItems)
    const itemsPrice = validItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2);
    const shippingPrice = (itemsPrice > 100 ? 0 : 10).toFixed(2);
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2)).toFixed(2);
    const totalPrice = (Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)).toFixed(2);

    useEffect(() => {
        if (!cart.shippingAddress.address) {
            navigate('/shipping');
        } else if (!cart.paymentMethod) {
            navigate('/payment');
        }
    }, [cart.paymentMethod, cart.shippingAddress.address, navigate]);

    const dispatch = useDispatch();
    const { order, success, error } = useSelector((state) => state.order);

    useEffect(() => {
        if (success) {
            toast.success('Order placed successfully!');
            dispatch(resetOrder());
            dispatch(clearCartLocal());
            navigate('/order-success');
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error, navigate, dispatch]);

    const placeOrderHandler = () => {
        dispatch(createOrder({
            orderItems: validItems,
            shippingAddress: cart.shippingAddress,
            paymentMethod: cart.paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
        }));
    };

    return (
        <div className="max-w-6xl mx-auto pt-10 px-4">
            <CheckoutSteps step1 step2 step3 step4 />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Shipping Address */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Shipping</h2>
                            <Link to="/shipping" className="text-primary hover:text-purple-700 flex items-center gap-1 text-sm font-medium transition-colors">
                                <FiEdit2 /> Edit
                            </Link>
                        </div>
                        <div className="text-slate-600 space-y-1">
                            <p><span className="font-semibold text-slate-800">Name:</span> {cart.shippingAddress.name}</p>
                            <p><span className="font-semibold text-slate-800">Phone:</span> {cart.shippingAddress.phone}</p>
                            <p><span className="font-semibold text-slate-800">Address:</span> {cart.shippingAddress.address}, {cart.shippingAddress.city}, {cart.shippingAddress.state} - {cart.shippingAddress.postalCode}, {cart.shippingAddress.country}</p>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Payment Method</h2>
                            <Link to="/payment" className="text-primary hover:text-purple-700 flex items-center gap-1 text-sm font-medium transition-colors">
                                <FiEdit2 /> Edit
                            </Link>
                        </div>
                        <p className="text-slate-600">
                            <span className="font-semibold text-slate-800">Method:</span> {cart.paymentMethod}
                        </p>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Order Items</h2>
                        {validItems.length === 0 ? (
                            <div className="text-slate-500">Your order has no in-stock items.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {validItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 py-4">
                                        <div className="w-16 h-16 rounded-lg bg-slate-50 p-2 flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/product/${item.product}`} className="text-slate-800 font-medium hover:text-primary truncate block transition-colors">
                                                {item.name}
                                            </Link>
                                            <p className="text-sm text-slate-500">
                                                {item.qty} x {formatCurrency(item.price)} = <span className="font-bold text-slate-900">{formatCurrency(item.qty * item.price)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Notification for excluded items */}
                        {cart.cartItems.length > validItems.length && (
                            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                Note: {cart.cartItems.length - validItems.length} item(s) are out of stock or unavailable and have been excluded.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>Items</span>
                                <span>{formatCurrency(Number(itemsPrice))}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{formatCurrency(Number(shippingPrice))}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax</span>
                                <span>{formatCurrency(Number(taxPrice))}</span>
                            </div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div className="flex justify-between text-lg font-bold text-slate-900">
                                <span>Total</span>
                                <span>{formatCurrency(Number(totalPrice))}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 active:scale-95 transition-all text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={placeOrderHandler}
                            disabled={validItems.length === 0}
                        >
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceOrderPage;
