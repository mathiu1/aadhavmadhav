import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheckCircle, FiPackage, FiHome } from 'react-icons/fi';
import { motion } from 'framer-motion';

const OrderSuccessPage = () => {
    // In a real app, you might fetch the order details using the ID from params
    // const { id } = useParams();
    // const dispatch = useDispatch();
    // const { order } = useSelector((state) => state.orderDetails);

    // For now, we will just show a static success message 
    // since the order state in redux is reset after success (in PlaceOrderPage).
    // To show details, we would need to implement getOrderDetails API.

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-100 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl -z-10 animate-pulse-slow delay-700"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full border border-white"
            >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="text-5xl text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-4">Order Placed Successfully!</h1>
                <p className="text-slate-500 mb-8">
                    Thank you for your purchase. Your order has been confirmed and will be shipped soon.
                    You will receive an email confirmation shortly.
                </p>

                <div className="space-y-4">
                    <Link
                        to="/profile"
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                    >
                        <FiPackage /> View Order History
                    </Link>

                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <FiHome /> Continue Shopping
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccessPage;
