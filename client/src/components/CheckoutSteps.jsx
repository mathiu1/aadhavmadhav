import { Link } from 'react-router-dom';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
    return (
        <div className="flex justify-center items-center mb-8">
            <div className="flex items-center w-full max-w-xl relative">

                {/* Step 1: Login */}
                <div className="flex-1 flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step1 ? '✓' : '1'}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step1 ? 'text-primary' : 'text-slate-500'}`}>Login</span>
                </div>

                {/* Connector 1-2 */}
                <div className={`flex-auto h-1 w-16 ${step1 && step2 ? 'bg-primary' : 'bg-slate-200'}`}></div>

                {/* Step 2: Shipping */}
                <div className="flex-1 flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step2 ? (step3 ? '✓' : '2') : '2'}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step2 ? 'text-primary' : 'text-slate-500'}`}>Shipping</span>
                </div>

                {/* Connector 2-3 */}
                <div className={`flex-auto h-1 w-16 ${step2 && step3 ? 'bg-primary' : 'bg-slate-200'}`}></div>

                {/* Step 3: Payment */}
                <div className="flex-1 flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step3 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {step3 ? (step4 ? '✓' : '3') : '3'}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step3 ? 'text-primary' : 'text-slate-500'}`}>Payment</span>
                </div>

                {/* Connector 3-4 */}
                <div className={`flex-auto h-1 w-16 ${step3 && step4 ? 'bg-primary' : 'bg-slate-200'}`}></div>

                {/* Step 4: Place Order */}
                <div className="flex-1 flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step4 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                        4
                    </div>
                    <span className={`text-xs mt-2 font-medium ${step4 ? 'text-primary' : 'text-slate-500'}`}>Place Order</span>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSteps;
