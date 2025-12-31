import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { savePaymentMethod } from '../slices/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';

const PaymentPage = () => {
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const cart = useSelector((state) => state.cart);
    const { shippingAddress } = cart;

    if (!shippingAddress.address) {
        navigate('/shipping');
    }

    const submitHandler = (e) => {
        e.preventDefault();
        dispatch(savePaymentMethod(paymentMethod));
        navigate('/placeorder');
    };

    return (
        <div className="max-w-xl mx-auto pt-10 px-4">
            <CheckoutSteps step1 step2 step3 />

            <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100">
                <h1 className="text-3xl font-bold mb-6 text-slate-900">Payment Method</h1>

                <form onSubmit={submitHandler} className="space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-700">Select Method</h2>

                        {/* Cash On Delivery */}
                        <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border-slate-200 has-[:checked]:border-primary has-[:checked]:bg-purple-50">
                            <input
                                type="radio"
                                id="CashOnDelivery"
                                name="paymentMethod"
                                value="Cash on Delivery"
                                checked={paymentMethod === 'Cash on Delivery'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                            />
                            <span className="ml-3 font-medium text-slate-700">Cash on Delivery</span>
                        </label>

                        {/* Online Payment (Disabled) */}
                        <label className="relative flex items-center p-4 border rounded-xl cursor-not-allowed bg-slate-50 border-slate-200 opacity-70">
                            <input
                                type="radio"
                                id="OnlinePayment"
                                name="paymentMethod"
                                value="OnlinePayment"
                                disabled
                                className="w-5 h-5 text-slate-400 focus:ring-0 border-gray-300 cursor-not-allowed bg-slate-100"
                            />
                            <div className="ml-3 flex flex-col items-start">
                                <span className="font-medium text-slate-500">Online Payment</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-white bg-slate-400 px-2 py-0.5 rounded-full mt-1">Coming Soon</span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-95 transition-all duration-200"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentPage;
