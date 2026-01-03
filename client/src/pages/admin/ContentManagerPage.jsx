import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSiteConfig, updateSiteConfig, initConfig } from '../../slices/contentSlice';
import { FiSave, FiLayout, FiGrid, FiTrash2, FiPlus, FiAlertTriangle, FiCheckCircle, FiInfo, FiRefreshCw, FiImage, FiSettings, FiTruck, FiPercent, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageUrl';

const GRADIENT_POOL = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-teal-400',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-violet-600 to-indigo-600',
    'from-fuchsia-600 to-pink-600',
    'from-rose-500 to-orange-600',
    'from-teal-500 to-green-500',
    'from-sky-500 to-indigo-500',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-500',
    'from-slate-900 to-slate-700',
    'from-red-600 to-rose-600',
    'from-blue-600 to-violet-600',
    'from-fuchsia-500 to-purple-600',
    'from-gray-900 to-gray-600',
    'from-indigo-400 to-cyan-400',
    'from-rose-400 to-red-500',
    'from-emerald-400 to-cyan-400',
    'from-amber-200 to-yellow-400'
];

const ColorPicker = ({ value, onChange }) => {
    const [page, setPage] = useState(0);
    const itemsPerPage = 6;

    const currentPool = GRADIENT_POOL.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const handleNext = () => {
        setPage((prev) => ((prev + 1) * itemsPerPage < GRADIENT_POOL.length) ? prev + 1 : 0);
    };

    const handleRandomOne = () => {
        const random = GRADIENT_POOL[Math.floor(Math.random() * GRADIENT_POOL.length)];
        onChange(random);
    };

    return (
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Theme & Color</label>
                <div className="flex gap-2">
                    <button
                        onClick={handleRandomOne}
                        type="button"
                        className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200 hover:border-primary hover:shadow-sm"
                        title="Pick Random Color"
                    >
                        <FiLayout /> Random
                    </button>
                    <button
                        onClick={handleNext}
                        type="button"
                        className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200 hover:border-primary hover:shadow-sm"
                    >
                        <FiRefreshCw /> More
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                    {currentPool.map((gradient) => (
                        <button
                            key={gradient}
                            onClick={() => onChange(gradient)}
                            type="button"
                            className={`aspect-square w-full rounded-full bg-gradient-to-br ${gradient} transition-all shadow-sm hover:scale-110 relative ${value === gradient ? 'ring-2 ring-slate-800 ring-offset-2 scale-110 shadow-md' : 'ring-1 ring-black/5 hover:ring-black/10'}`}
                            title={gradient}
                        >
                            {value === gradient && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" /></div>}
                        </button>
                    ))}
                </div>

                <div className="relative group">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${value} border border-black/10 shadow-sm transition-transform group-hover:scale-110`}></div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-300"
                        placeholder="e.g., from-purple-500 to-pink-500"
                    />
                </div>
            </div>
        </div>
    );
};

const ContentManagerPage = () => {
    const dispatch = useDispatch();
    const { config, loading, error } = useSelector((state) => state.content);

    // Local state for form management
    const [heroSlides, setHeroSlides] = useState([]);
    const [categoryCards, setCategoryCards] = useState([]);
    const [taxRate, setTaxRate] = useState(18);
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);
    const [shippingPrice, setShippingPrice] = useState(40);

    // Modal State
    const [modal, setModal] = useState({
        isOpen: false,
        type: null, // 'save', 'delete', 'add'
        index: null, // for delete operations
    });

    useEffect(() => {
        dispatch(getSiteConfig());
    }, [dispatch]);

    useEffect(() => {
        if (config) {
            setHeroSlides(config.heroSlides || []);
            setCategoryCards(config.categoryCards || []);
            setTaxRate(config.taxRate !== undefined ? config.taxRate * 100 : 18);
            setFreeDeliveryThreshold(config.freeDeliveryThreshold !== undefined ? config.freeDeliveryThreshold : 500);
            setShippingPrice(config.shippingPrice !== undefined ? config.shippingPrice : 40);
        } else if (!loading && !config && !error) {
            dispatch(initConfig()).then(() => dispatch(getSiteConfig()));
        }
    }, [config, loading, error, dispatch]);

    // Input Handlers
    const handleHeroChange = (index, field, value) => {
        const newSlides = [...heroSlides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setHeroSlides(newSlides);
    };

    const handleCardChange = (index, field, value) => {
        const newCards = [...categoryCards];
        newCards[index] = { ...newCards[index], [field]: value };
        setCategoryCards(newCards);
    };

    const deleteOldImage = async (imagePath) => {
        // Handle both relative "/uploads/file.jpg" and absolute "http://.../uploads/file.jpg"
        if (imagePath && imagePath.includes('/uploads/')) {
            const parts = imagePath.split('/uploads/');
            const filename = parts[parts.length - 1]; // Get the last part (filename)

            // Sanity check: ensure filename doesn't contain further path separators
            if (!filename || filename.includes('/') || filename.includes('\\')) return;

            try {
                console.log("Attempting to delete old image:", filename);
                await api.delete(`/upload/${filename}`);
                // Optional: toast.success('Old image cleanup success');
            } catch (err) {
                console.error("Failed to delete old image on server", err);
            }
        }
    };

    const uploadFileHandler = async (e, index, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('images', file);

        try {
            // 1. Upload new image
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await api.post('/upload', formData, config);
            const newImagePath = data[0];

            // 2. Identify old image path to delete
            let oldImagePath = '';
            if (type === 'hero') {
                oldImagePath = heroSlides[index].image;
                handleHeroChange(index, 'image', newImagePath);
                toast.success('Hero image uploaded!');
            } else if (type === 'card') {
                oldImagePath = categoryCards[index].image;
                handleCardChange(index, 'image', newImagePath);
                toast.success('Category image uploaded!');
            }

            // 3. Delete old image if it was a local upload
            if (oldImagePath) {
                await deleteOldImage(oldImagePath);
            }

        } catch (error) {
            console.error(error);
            toast.error('Image upload failed');
        }
    };

    // Action Requesters (Open Modal)
    const requestSave = () => {
        setModal({ isOpen: true, type: 'save' });
    };

    const requestAddSlide = () => {
        setModal({ isOpen: true, type: 'add-hero' });
    };

    const requestRemoveSlide = (index) => {
        if (heroSlides.length === 1) {
            toast.error("You must have at least one hero slide.");
            return;
        }
        setModal({ isOpen: true, type: 'delete-hero', index });
    };

    const requestAddCard = () => {
        setModal({ isOpen: true, type: 'add-card' });
    };

    const requestRemoveCard = (index) => {
        setModal({ isOpen: true, type: 'delete-card', index });
    };

    // Action Executor
    const executeAction = () => {
        if (modal.type === 'save') {
            dispatch(updateSiteConfig({
                heroSlides,
                categoryCards,
                taxRate: Number(taxRate) / 100,
                freeDeliveryThreshold: Number(freeDeliveryThreshold),
                shippingPrice: Number(shippingPrice)
            }));
            toast.success("Content updated successfully!");
        } else if (modal.type === 'add-hero') {
            const newSlide = {
                badge: 'New Arrival',
                title: 'New Collection',
                highlight: '2026',
                description: 'Description goes here.',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
                bgColor: 'from-blue-50 to-indigo-50'
            };
            setHeroSlides([...heroSlides, newSlide]);
            toast.success("New slide added!");

            // Scroll to bottom after small delay
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);

        } else if (modal.type === 'delete-hero') {
            const newSlides = heroSlides.filter((_, i) => i !== modal.index);
            setHeroSlides(newSlides);
            toast.success("Slide removed.");
        } else if (modal.type === 'add-card') {
            const newCard = {
                id: `Card ${categoryCards.length + 1}`,
                title: 'New Category',
                subtitle: 'Trending',
                image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2',
                link: '/products',
                buttonText: 'View More',
                isEnabled: true
            };
            setCategoryCards([...categoryCards, newCard]);
            toast.success("New card added!");
        } else if (modal.type === 'delete-card') {
            const newCards = categoryCards.filter((_, i) => i !== modal.index);
            setCategoryCards(newCards);
            toast.success("Card removed.");
        }
        closeModal();
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: null, index: null });
    };

    if (loading && !config && heroSlides.length === 0) {
        return (
            <div className="flex justify-center p-20">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // Modal Content Logic
    const getModalContent = () => {
        switch (modal.type) {
            case 'save':
                return {
                    title: 'Save Changes?',
                    message: 'Are you sure you want to push these changes to the live site?',
                    icon: <FiSave size={32} />,
                    color: 'text-primary',
                    bgColor: 'bg-purple-50',
                    btnColor: 'bg-primary hover:bg-primary-dark',
                    actionLabel: 'Save Changes'
                };
            case 'add-hero':
                return {
                    title: 'Add New Banner?',
                    message: 'This will add a new default slide to your hero section.',
                    icon: <FiPlus size={32} />,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50',
                    btnColor: 'bg-green-500 hover:bg-green-600',
                    actionLabel: 'Add Banner'
                };
            case 'delete-hero':
                return {
                    title: 'Delete Banner?',
                    message: 'Are you sure you want to remove this banner? This action cannot be undone.',
                    icon: <FiTrash2 size={32} />,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50',
                    btnColor: 'bg-red-500 hover:bg-red-600',
                    actionLabel: 'Delete Banner'
                };
            case 'add-card':
                return {
                    title: 'Add Category Card?',
                    message: 'Add a new category card to the grid layout.',
                    icon: <FiPlus size={32} />,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50',
                    btnColor: 'bg-blue-500 hover:bg-blue-600',
                    actionLabel: 'Add Card'
                };
            case 'delete-card':
                return {
                    title: 'Delete Card?',
                    message: 'Are you sure you want to remove this category card?',
                    icon: <FiTrash2 size={32} />,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50',
                    btnColor: 'bg-red-500 hover:bg-red-600',
                    actionLabel: 'Delete Card'
                };
            default:
                return {};
        }
    };

    const modalContent = getModalContent();

    return (
        <div className="w-full max-w-[1600px] mx-auto pb-20 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-6 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                        Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Manager</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">Customize your homepage banners and categories.</p>
                </div>
                <button
                    onClick={requestSave}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                >
                    <FiSave /> Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
                {/* Store Settings */}
                <div className="col-span-1 lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl text-slate-900 select-none pointer-events-none rotate-12">
                        <FiSettings />
                    </div>
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 relative z-10 text-slate-800">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <FiSettings />
                        </div>
                        Store Configuration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                        {/* Tax Rate */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group/input hover:bg-white hover:shadow-sm">
                            <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wider flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md shadow-sm text-primary"><FiPercent size={12} /></div> Tax Rate (GST)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl text-xl font-black text-slate-800 px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all pr-12"
                                    placeholder="18"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium pl-1">Applied to order subtotal automatically.</p>
                        </div>

                        {/* Free Delivery */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-green-500/30 transition-all group/input hover:bg-white hover:shadow-sm">
                            <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wider flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md shadow-sm text-green-500"><FiTruck size={12} /></div> Free Delivery Above
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    value={freeDeliveryThreshold}
                                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl text-xl font-black text-slate-800 px-4 py-3 pl-10 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                    placeholder="500"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium pl-1">Orders exceeding this value get <span className="text-green-600 font-bold">Free Shipping</span>.</p>
                        </div>

                        {/* Standard Shipping */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-blue-500/30 transition-all group/input hover:bg-white hover:shadow-sm">
                            <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wider flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md shadow-sm text-blue-500"><FiTruck size={12} /></div> Standard Shipping
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    value={shippingPrice}
                                    onChange={(e) => setShippingPrice(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl text-xl font-black text-slate-800 px-4 py-3 pl-10 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="40"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium pl-1">Base shipping fee for orders under the threshold.</p>
                        </div>
                    </div>
                </div>

                {/* Hero Slides Editor */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FiLayout /> Hero Banners
                        </h2>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{heroSlides.length} Slides</span>
                    </div>

                    {heroSlides.map((slide, index) => (
                        <div key={index} className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:border-primary/20 group relative overflow-hidden">
                            {/* Decorative Background Blur */}
                            <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br ${slide.bgColor} opacity-10 blur-3xl rounded-full pointer-events-none group-hover:opacity-20 transition-opacity duration-700`}></div>

                            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Hero Slide</h3>
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${slide.bgColor} ring-2 ring-white shadow-sm`}></div>
                                </div>
                                <button
                                    onClick={() => requestRemoveSlide(index)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                                    title="Remove Slide"
                                >
                                    <FiTrash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {/* Top Row: Badge & Color */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Badge Text</label>
                                            <input
                                                type="text"
                                                value={slide.badge}
                                                onChange={(e) => handleHeroChange(index, 'badge', e.target.value)}
                                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="e.g. New Arrival"
                                            />
                                        </div>
                                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Preview Image</label>
                                            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-200 shadow-inner relative group/img">
                                                <img src={getImageUrl(slide.image)} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                    <p className="text-white text-xs font-bold">Preview Mode</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color Picker Column */}
                                    <div>
                                        <ColorPicker
                                            value={slide.bgColor}
                                            onChange={(val) => handleHeroChange(index, 'bgColor', val)}
                                        />
                                    </div>
                                </div>

                                {/* Title Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Main Title</label>
                                        <input
                                            type="text"
                                            value={slide.title}
                                            onChange={(e) => handleHeroChange(index, 'title', e.target.value)}
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:font-normal"
                                            placeholder="e.g. Wear Your"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Visual Highlight</label>
                                        <input
                                            type="text"
                                            value={slide.highlight}
                                            onChange={(e) => handleHeroChange(index, 'highlight', e.target.value)}
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                            placeholder="e.g. Vibe."
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={slide.description}
                                        onChange={(e) => handleHeroChange(index, 'description', e.target.value)}
                                        rows="2"
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                        placeholder="Brief subtitle for the banner..."
                                    ></textarea>
                                </div>

                                {/* Image URL */}
                                {/* Image Selection: File Upload OR URL */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Background Image</label>

                                    <div className="flex gap-4 mb-3">
                                        <label className="flex-1 cursor-pointer bg-white border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-slate-500 group/upload">
                                            <FiUpload className="text-xl group-hover/upload:text-primary transition-colors" />
                                            <span className="text-xs font-bold">Upload File</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => uploadFileHandler(e, index, 'hero')}
                                            />
                                        </label>
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase">OR</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={getImageUrl(slide.image)}
                                            onChange={(e) => handleHeroChange(index, 'image', e.target.value)}
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 px-4 py-3 pl-10 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            placeholder="Paste Image URL"
                                        />
                                        <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={requestAddSlide}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all group active:scale-[0.99]"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                            <FiPlus className="group-hover:text-primary" />
                        </div>
                        Add New Banner
                    </button>

                </div>

                {/* Category Grid Editor */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FiGrid /> Category Grid
                    </h2>

                    {categoryCards.map((card, index) => (
                        <div key={index} className={`bg-white rounded-[2rem] p-6 shadow-sm border transaction-all duration-300 relative overflow-hidden group ${card.isEnabled === false ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:shadow-md'}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-50 font-black text-6xl text-slate-50 select-none -z-0 pointer-events-none">
                                {card.id}
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${card.isEnabled !== false ? 'bg-green-500' : 'bg-slate-300'} ring-2 ring-white shadow-sm`}></div>
                                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{card.id}</h3>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.isEnabled !== false ? 'Active' : 'Disabled'}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={card.isEnabled !== false}
                                                onChange={(e) => handleCardChange(index, 'isEnabled', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                        <button
                                            onClick={() => requestRemoveCard(index)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
                                            title="Remove Card"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className={`space-y-4 transition-all duration-300 ${card.isEnabled === false ? 'opacity-50 pointer-events-none blur-[1px]' : ''}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Title</label>
                                            <input
                                                type="text"
                                                value={card.title}
                                                onChange={(e) => handleCardChange(index, 'title', e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Subtitle</label>
                                            <input
                                                type="text"
                                                value={card.subtitle}
                                                onChange={(e) => handleCardChange(index, 'subtitle', e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {card.id !== 'promo' && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Image</label>

                                            <div className="grid grid-cols-[1fr,auto] gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={getImageUrl(card.image)}
                                                    onChange={(e) => handleCardChange(index, 'image', e.target.value)}
                                                    className="bg-slate-50 border-none rounded-xl text-xs font-mono text-slate-500 px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="URL..."
                                                />
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                    <img src={getImageUrl(card.image)} alt="Prev" className="w-full h-full object-cover" />
                                                </div>
                                            </div>

                                            <label className="cursor-pointer bg-white border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all rounded-xl py-2 px-4 flex items-center justify-center gap-2 text-slate-500 text-xs font-bold group/upload">
                                                <FiUpload className="group-hover/upload:text-primary transition-colors" />
                                                <span>Upload File Instead</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => uploadFileHandler(e, index, 'card')}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {card.id === 'promo' && (
                                        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                                            <label className="text-xs font-bold text-pink-400 mb-1 block">Promo Code</label>
                                            <input
                                                type="text"
                                                value={card.promoCode}
                                                onChange={(e) => handleCardChange(index, 'promoCode', e.target.value)}
                                                className="w-full bg-white border border-pink-200 rounded-xl text-sm font-bold text-pink-600 px-4 py-2 focus:ring-2 focus:ring-pink-300 outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-400 mb-1 block">Link URL</label>
                                            <input
                                                type="text"
                                                value={card.link || '/products'}
                                                onChange={(e) => handleCardChange(index, 'link', e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-xl text-xs font-medium px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        {card.buttonText && (
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 mb-1 block">Button Text</label>
                                                <input
                                                    type="text"
                                                    value={card.buttonText}
                                                    onChange={(e) => handleCardChange(index, 'buttonText', e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-xl text-xs font-medium px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={requestAddCard}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all group active:scale-[0.99]"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                            <FiPlus className="group-hover:text-blue-500" />
                        </div>
                        Add New Category Card
                    </button>
                </div>
            </div>

            {/* Real-time Preview Link Hint */}
            <div className="fixed bottom-8 right-8 z-50">
                <a href="/" target="_blank" className="bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                    <FiLayout /> Open Live Site to Preview
                </a>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {modal.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-center"
                        >
                            <div className={`w-16 h-16 ${modalContent.bgColor} ${modalContent.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                {modalContent.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">
                                {modalContent.title}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">
                                {modalContent.message}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAction}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] ${modalContent.btnColor}`}
                                >
                                    {modalContent.actionLabel}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContentManagerPage;
