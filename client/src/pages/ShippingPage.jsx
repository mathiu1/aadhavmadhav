import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveShippingAddress } from '../slices/cartSlice';
import CheckoutSteps from '../components/CheckoutSteps';
import { State, City } from 'country-state-city';
import toast from 'react-hot-toast';

const ShippingPage = () => {
    const cart = useSelector((state) => state.cart);
    const { shippingAddress } = cart;

    const [name, setName] = useState(shippingAddress.name || '');
    const [phone, setPhone] = useState(shippingAddress.phone || '');
    const [address, setAddress] = useState(shippingAddress.address || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [errors, setErrors] = useState({});

    // State and City Logic
    const [stateName, setStateName] = useState(shippingAddress.state || '');
    const [cityName, setCityName] = useState(shippingAddress.city || '');

    const [stateCode, setStateCode] = useState('');
    const [availableCities, setAvailableCities] = useState([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Get all states for India
    const allStates = State.getStatesOfCountry('IN');

    // Initialize State Code from saved Name if exists
    useEffect(() => {
        if (stateName) {
            const foundState = allStates.find(s => s.name === stateName);
            if (foundState) {
                setStateCode(foundState.isoCode);
            }
        }
    }, [stateName]);

    // Update cities when stateCode changes
    useEffect(() => {
        if (stateCode) {
            const cities = City.getCitiesOfState('IN', stateCode);
            setAvailableCities(cities);

            // Clear city if strictly changing states manually (not on initial load)
            // But checking if current city exists in new list is better
            // For simplicity, if the user picks a new state, we might want to reset city, 
            // but the useEffect runs on mount too. We should be careful not to clear saved city on mount.
        } else {
            setAvailableCities([]);
        }
    }, [stateCode]);

    const handleStateChange = (e) => {
        const code = e.target.value;
        const stateObj = allStates.find(s => s.isoCode === code);

        setStateCode(code);
        setStateName(stateObj ? stateObj.name : '');
        setCityName(''); // Reset city when state changes by user interaction
    };

    const submitHandler = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (name.trim().length < 3) {
            newErrors.name = true;
            toast.error('Please enter a valid full name');
        }

        if (phone.length !== 10 || isNaN(phone)) {
            newErrors.phone = true;
            toast.error('Please enter a valid 10-digit phone number');
        }

        if (postalCode.length !== 6 || isNaN(postalCode)) {
            newErrors.postalCode = true;
            toast.error('Please enter a valid 6-digit postal code');
        }

        if (address.trim().length < 5) {
            newErrors.address = true;
            toast.error('Please enter a valid address');
        }

        if (stateCode && !cityName) {
            newErrors.city = true;
            toast.error('Please select a city');
        }

        if (!stateCode) {
            newErrors.state = true;
            toast.error('Please select a state');
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        dispatch(saveShippingAddress({
            name,
            phone,
            address,
            city: cityName,
            state: stateName,
            postalCode,
            country: 'India' // Hardcoded as per request
        }));
        navigate('/payment');
    };

    return (
        <div className="max-w-xl mx-auto pt-10 px-4">
            <CheckoutSteps step1 step2 />

            <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100">
                <h1 className="text-3xl font-bold mb-6 text-slate-900">Shipping Address</h1>

                <form onSubmit={submitHandler} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter full name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: false });
                            }}
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter phone number"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: false });
                            }}
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <input
                            type="text"
                            required
                            placeholder="House No, Street Area"
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value);
                                if (errors.address) setErrors({ ...errors, address: false });
                            }}
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                            <select
                                required
                                value={stateCode}
                                onChange={(e) => {
                                    handleStateChange(e);
                                    if (errors.state) setErrors({ ...errors, state: false });
                                }}
                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none ${errors.state ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <option value="">Select State</option>
                                {allStates.map((state) => (
                                    <option key={state.isoCode} value={state.isoCode}>
                                        {state.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                            <select
                                required
                                value={cityName}
                                onChange={(e) => {
                                    setCityName(e.target.value);
                                    if (errors.city) setErrors({ ...errors, city: false });
                                }}
                                disabled={!stateCode}
                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400 ${errors.city ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <option value="">Select City</option>
                                {availableCities.map((city) => (
                                    <option key={city.name} value={city.name}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter postal code"
                            value={postalCode}
                            onChange={(e) => {
                                setPostalCode(e.target.value);
                                if (errors.postalCode) setErrors({ ...errors, postalCode: false });
                            }}
                            className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.postalCode ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-6 bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 active:scale-95 transition-all duration-200"
                    >
                        Continue to Payment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ShippingPage;
