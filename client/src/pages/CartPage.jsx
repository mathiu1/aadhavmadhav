import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiArrowRight, FiShoppingBag, FiStar } from 'react-icons/fi';
import { addToCart, removeFromCart } from '../slices/cartSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUrl';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { cartItems, isLoading } = useSelector((state) => state.cart);
    const { userInfo } = useSelector((state) => state.auth);

    const updateQuantityHandler = (item, newQty) => {
        if (newQty < 1) return;
        dispatch(addToCart({ ...item, qty: newQty }));
    };

    const removeFromCartHandler = (id) => {
        dispatch(removeFromCart(id));
    };

    const checkoutHandler = () => {
        if (userInfo) {
            navigate('/shipping');
        } else {
            navigate('/login?redirect=/shipping');
        }
    };

    // Filter out items that are out of stock for the summary calculation
    const validItems = cartItems.filter(item => !item.isOutOfStock);
    const itemsPrice = validItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over $100
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2)); // Tax
    const totalPrice = (Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)).toFixed(2);

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-100 p-8 rounded-full mb-6"
                >
                    <FiShoppingBag className="text-6xl text-purple-600" />
                </motion.div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
                <p className="text-slate-500 mb-8 max-w-md text-center">
                    Looks like you haven't added anything to your cart yet.
                    Start shopping to fill it with amazing products!
                </p>
                <Link
                    to="/products"
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                    Start Shopping <FiArrowRight />
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                Shopping Cart
                <span className="text-base font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{cartItems.reduce((acc, item) => acc + item.qty, 0)} items</span>
            </h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Cart Items List */}
                <div className="flex-grow space-y-4">
                    {cartItems.map((item) => (
                        <motion.div
                            key={item.product._id || item.product}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            layout
                            className={`glass-panel p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4 group relative ${item.isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
                        >
                            {/* Delete Button - New Position (Top Right) */}
                            <button
                                onClick={() => removeFromCartHandler(item.product._id || item.product)}
                                className="absolute top-2 right-2 p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors z-10"
                                aria-label="Remove item"
                            >
                                <FiTrash2 size={18} className="sm:w-5 sm:h-5" />
                            </button>

                            {/* Image - Compact on mobile */}
                            <div className="w-20 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-slate-100 p-2 relative">
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                />
                                {item.isOutOfStock && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-center">
                                        <span className="text-white text-[10px] uppercase font-bold px-1 py-0.5 bg-red-600 rounded">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-grow min-w-0 pr-8">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-2">
                                    <div className="flex-grow text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.discountPercentage > 0 && (
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">
                                                    {item.discountPercentage}% OFF
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            to={`/product/${item.product._id || item.product}`}
                                            className="text-sm sm:text-lg font-semibold text-slate-800 hover:text-purple-600 transition-colors line-clamp-2"
                                        >
                                            {item.name}
                                        </Link>

                                        {/* Rating Stars - Added */}
                                        <div className="flex items-center gap-1 mt-1 mb-1">
                                            <FiStar className="text-yellow-400 fill-current text-[10px] sm:text-xs" />
                                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">4.8 (120)</span>
                                        </div>

                                        <p className="text-xs text-slate-500 hidden sm:block">{item.category}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-2 gap-3 sm:gap-0">
                                    <div className="flex flex-col">
                                        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-0 sm:gap-2 items-start">
                                            <p className="text-purple-600 font-bold text-base sm:text-lg">{formatCurrency(item.price)}</p>
                                            {item.oldPrice > item.price && (
                                                <p className="text-slate-400 text-xs sm:text-sm line-through">{formatCurrency(item.oldPrice)}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
                                        {/* Qty Controls */}
                                        <div className={`flex items-center justify-between w-full sm:w-auto bg-slate-50 rounded-lg border border-slate-200 h-10 sm:h-9 ${item.isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <button
                                                onClick={() => updateQuantityHandler(item, item.qty - 1)}
                                                disabled={item.qty <= 1}
                                                className="px-2 sm:px-3 h-full hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                            >
                                                <FiMinus size={12} />
                                            </button>
                                            <span className="w-6 sm:w-10 text-center font-bold text-slate-700 text-xs sm:text-sm">{item.qty}</span>
                                            <button
                                                onClick={() => updateQuantityHandler(item, item.qty + 1)}
                                                disabled={item.qty >= item.countInStock}
                                                className="px-2 sm:px-3 h-full hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                            >
                                                <FiPlus size={12} />
                                            </button>
                                        </div>

                                        {/* Subtotal (Desktop Only) */}
                                        <div className="text-right min-w-[80px] hidden sm:block">
                                            <p className="font-bold text-slate-800">{formatCurrency(item.price * item.qty)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:w-[380px] flex-shrink-0">
                    <div className="glass-panel p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(itemsPrice)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span>
                                <span>{shippingPrice === 0 ? <span className="text-green-600 font-medium">Free</span> : formatCurrency(shippingPrice)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax (Est.)</span>
                                <span>{formatCurrency(taxPrice)}</span>
                            </div>
                            <div className="h-px bg-slate-200 my-2"></div>
                            <div className="flex justify-between text-slate-900 font-bold text-lg">
                                <span>Total</span>
                                <span>{formatCurrency(Number(totalPrice))}</span>
                            </div>
                        </div>

                        <button
                            onClick={checkoutHandler}
                            disabled={validItems.length === 0}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center gap-2 ${validItems.length === 0
                                ? 'bg-slate-400 cursor-not-allowed shadow-none text-slate-100'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            Proceed to Checkout <FiArrowRight />
                        </button>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
