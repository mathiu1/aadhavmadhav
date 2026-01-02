import { Link } from 'react-router-dom';
import { FiUser, FiTruck, FiCreditCard, FiCheckCircle, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
    const steps = [
        { label: 'Login', icon: FiUser, active: step1, completed: step1 && step2 },
        { label: 'Shipping', icon: FiTruck, active: step2, completed: step2 && step3 },
        { label: 'Payment', icon: FiCreditCard, active: step3, completed: step3 && step4 },
        { label: 'Place Order', icon: FiCheckCircle, active: step4, completed: false }, // Final step is never "completed" in the nav sense, just active
    ];

    // Calculate progress percentage for the bar
    let progress = 0;
    if (step1) progress = 0; // Just started
    if (step2) progress = 33;
    if (step3) progress = 66;
    if (step4) progress = 100;

    return (
        <div className="w-full max-w-4xl mx-auto mb-10 px-4">
            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 rounded-full -translate-y-1/2 -z-0"></div>

                {/* Active Progress Line */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-primary to-purple-500 rounded-full -translate-y-1/2 -z-0"
                />

                {/* Steps */}
                <div className="relative z-10 flex justify-between w-full">
                    {steps.map((step, index) => {
                        // Logic for state
                        // If it's the current active step (but not completed next ones), it's "Current"
                        // If it's completed (next step is active), it's "Completed"

                        // Simplifying:
                        // Completed: step.completed (means we are past this step)
                        // Active: step.active (means we are at least here)
                        // Upcoming: !step.active

                        const isCompleted = step.completed;
                        const isActive = step.active;
                        const isCurrent = isActive && !isCompleted;

                        return (
                            <div key={index} className="flex flex-col items-center group">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`
                                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                        ${isActive
                                            ? 'bg-white border-primary text-primary shadow-lg shadow-primary/20'
                                            : 'bg-white border-slate-200 text-slate-300'
                                        }
                                        ${isCompleted ? '!bg-primary !border-primary !text-white' : ''}
                                    `}
                                >
                                    {isCompleted ? (
                                        <FiCheck className="text-lg md:text-xl" strokeWidth={3} />
                                    ) : (
                                        <step.icon className="text-lg md:text-xl" />
                                    )}
                                </motion.div>

                                <span className={`
                                    absolute -bottom-8 md:-bottom-8 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 w-24 text-center
                                    ${isActive ? 'text-slate-800' : 'text-slate-400'}
                                    ${isCurrent ? 'scale-110 text-primary' : ''}
                                `}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Spacing for labels */}
            <div className="h-8"></div>
        </div>
    );
};

export default CheckoutSteps;
