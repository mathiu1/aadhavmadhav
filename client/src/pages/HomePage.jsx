import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { FaFire, FaArrowRight, FaStar } from 'react-icons/fa';

const slides = [
    {
        id: 1,
        badge: '✨ Trendsetting Fashion',
        title: <>Wear Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Vibe.</span></>,
        desc: 'Premium t-shirts and apparel crafted for comfort and style. Upgrade your wardrobe with our latest 2025 collection.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop', // Fashion/Apparel image
        bgColor: 'from-purple-50 to-pink-50'
    },
    {
        id: 2,
        badge: '🎆 Celebration Special',
        title: <>Ignite The <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Celebration.</span></>,
        desc: 'Dazzling sky-shots and premium crackers for your special moments. Safe, loud, and spectacularly colorful.',
        image: 'https://images.unsplash.com/photo-1538374184611-910aa0465442?q=80&w=1624&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Cracker image
        bgColor: 'from-orange-50 to-red-50'
    },
    {
        id: 3,
        badge: '🌿 Premium Nutrition',
        title: <>The Art of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">Healthy Snacking.</span></>,
        desc: 'Hand-selected almonds, cashews, and walnuts. The perfect blend of taste and vitality for your active lifestyle.',
        image: 'https://images.unsplash.com/photo-1542990253-a781e04c0082?q=80&w=1094&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Nuts image
        bgColor: 'from-amber-50 to-yellow-50'
    }
];

const Slider = ({ products }) => {
    const sliderRef = useRef();
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const updateWidth = () => {
            if (sliderRef.current) {
                // Calculate total scrollable width: scrollWidth - clientWidth gives the max drag distance
                // We add a little extra padding (e.g., 20px) to ensure the last item is fully visible
                const newWidth = sliderRef.current.scrollWidth - sliderRef.current.offsetWidth;
                setWidth(newWidth > 0 ? newWidth + 20 : 0);
            }
        };

        // Initial calculation
        updateWidth();

        // Recalculate on resize (for mobile orientation/loading)
        window.addEventListener('resize', updateWidth);

        // Small timeout to ensure DOM is fully painted
        const timer = setTimeout(updateWidth, 100);

        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [products]);

    return (
        <div className="relative overflow-hidden p-2 md:p-4">
            <motion.div
                ref={sliderRef}
                className="flex gap-4 md:gap-6 cursor-grab active:cursor-grabbing px-2"
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                whileTap={{ cursor: "grabbing" }}
            >
                {products.slice(0, 8).map((product) => (
                    <motion.div
                        key={product._id}
                        className="min-w-[240px] md:min-w-[320px] pointer-events-auto"
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Request a larger page size to populate the home page sections
                const { data } = await api.get('/products?pageSize=100');
                // data is now { products: [...], page, pages }
                // Shuffle products once on load
                const shuffled = (data.products || []).sort(() => 0.5 - Math.random());
                setProducts(shuffled);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const [direction, setDirection] = useState(0);

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };

    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const paginate = (newDirection) => {
        setDirection(newDirection);
        setCurrentSlide((prev) => (prev + newDirection + slides.length) % slides.length);
    };

    // Auto Slider Logic
    useEffect(() => {
        const timer = setInterval(() => {
            paginate(1);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-12 md:space-y-24 pb-20">
            {/* Auto-Slider Hero Section */}
            <section className="relative h-[400px] md:h-[600px] w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-900 shadow-soft border border-slate-100 group">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);

                            if (swipe < -10000) {
                                paginate(1);
                            } else if (swipe > 10000) {
                                paginate(-1);
                            }
                        }}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={slides[currentSlide].image}
                                alt="Hero Background"
                                className="w-full h-full object-cover transition-transform duration-[10s] ease-linear transform scale-100 group-hover:scale-110"
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex items-center px-6 md:px-12">
                            <div className="max-w-xl space-y-4 md:space-y-6 pt-8 md:pt-0">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                >
                                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/10 font-bold text-[10px] md:text-sm mb-2 md:mb-4">
                                        {slides[currentSlide].badge}
                                    </span>
                                    <h1 className="text-3xl md:text-7xl font-black leading-tight tracking-tight text-white mb-2 md:mb-4 drop-shadow-lg">
                                        {slides[currentSlide].title}
                                    </h1>
                                    <p className="text-xs md:text-xl text-slate-200 font-medium max-w-lg mb-4 md:mb-8 leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-none">
                                        {slides[currentSlide].desc}
                                    </p>
                                    <div className="flex flex-wrap gap-3 md:gap-4">
                                        <Link to="/products" className="btn-primary flex items-center gap-2 group shadow-lg shadow-purple-900/50 py-2.5 px-5 md:py-3 md:px-6 text-xs md:text-base border-none">
                                            Shop Now <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                        <button className="px-5 py-2.5 md:px-6 md:py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 text-xs md:text-base">
                                            View Categories
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Slider Dots */}
                <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                const newDirection = index > currentSlide ? 1 : -1;
                                setDirection(newDirection);
                                setCurrentSlide(index);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm ${currentSlide === index ? 'bg-white w-6 md:w-8' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </section>

            {/* Categories Grid (Clean Bento) */}
            <section className="container mx-auto">
                <div className="flex justify-center mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900 text-center relative inline-block">
                        Shop by Category
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 md:w-12 h-1 bg-primary rounded-full"></div>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 h-auto md:h-[500px]">
                    {/* Large Main Category - Apparel */}
                    <Link to="/products" className="md:col-span-2 md:row-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[200px] md:h-auto">
                        <img src="https://plus.unsplash.com/premium_photo-1701204056531-f82d31308f1f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Apparel" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-white">
                            <p className="text-[10px] md:text-sm font-bold bg-white/20 backdrop-blur-md inline-block px-2 md:px-3 py-1 rounded-lg mb-1 md:mb-2">Custom Fit</p>
                            <h3 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Apparel</h3>
                            <p className="text-xs md:text-base text-slate-200 group-hover:translate-x-2 transition-transform duration-300">Explore Collection &rarr;</p>
                        </div>
                    </Link>

                    {/* Crackers */}
                    <Link to="/products" className="md:col-span-1 md:row-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[180px] md:h-auto">
                        <img src="https://images.unsplash.com/photo-1563303313-93627cc2a1aa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Crackers" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="text-xl md:text-2xl font-bold mb-1">Crackers</h3>
                            <p className="text-[10px] md:text-xs text-slate-300">Light up the night</p>
                        </div>
                    </Link>

                    {/* Nuts - Top */}
                    <Link to="/products" className="md:col-span-1 md:row-span-1 group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[150px] md:h-auto">
                        <img src="https://plus.unsplash.com/premium_photo-1726768984120-f476b15835f2?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Nuts" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="text-xl md:text-2xl font-bold mb-1">Nuts & Dry Fruits</h3>
                            <p className="text-xs md:text-sm text-slate-300">Healthy Snacking &rarr;</p>
                        </div>
                    </Link>

                    {/* Sale/Promo - Bottom */}
                    <div className="md:col-span-1 md:row-span-1 rounded-2xl md:rounded-3xl bg-secondary text-white p-6 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-pink-200 h-[150px] md:h-auto">
                        <div className="relative z-10">
                            <p className="font-bold opacity-80 mb-1 text-xs">Limited Offer</p>
                            <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2">Wait!</h3>
                            <p className="text-xs md:text-sm font-medium mb-3 md:mb-4">Get 20% off on first order.</p>
                            <button className="bg-white text-secondary px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-slate-100 transition-colors">Grab Code</button>
                        </div>
                        <div className="absolute -right-2 -top-2 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-2 -bottom-2 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
                    </div>
                </div>
            </section>

            {/* Trending Section */}
            <section className="container mx-auto">
                <div className="flex justify-between items-end mb-6 md:mb-8 px-2 md:px-4">
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 text-slate-900">
                            <FaFire className="text-orange-500" />
                            Trending Now
                        </h2>
                        <p className="text-xs md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Top picks for this week</p>
                    </div>
                    <Link to="/products" className="text-primary hover:text-primary-light transition-colors font-bold flex items-center gap-1 text-sm md:text-base">View All <FaArrowRight className="text-xs" /> </Link>
                </div>

                {loading ? (
                    <div className="space-y-12 animate-pulse">
                        <div className="flex gap-4 md:gap-6 overflow-hidden p-2 md:p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="min-w-[240px] md:min-w-[320px] h-80 bg-slate-200 rounded-2xl shrink-0"></div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            <div className="h-8 w-48 bg-slate-200 rounded-full mx-4"></div>
                            <div className="flex gap-4 md:gap-6 overflow-hidden p-2 md:p-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="min-w-[240px] md:min-w-[320px] h-80 bg-slate-200 rounded-2xl shrink-0"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 1. Trending Section (Mixed/Random) */}
                        <Slider products={products.slice(0, 10)} />

                        {/* 2. Dynamic Categories Sections */}
                        {[...new Set(products.map(p => p.category))].map(category => {
                            const categoryProducts = products.filter(p => p.category === category);
                            if (categoryProducts.length === 0) return null;

                            return (
                                <div key={category} className="mt-12 md:mt-20">
                                    <div className="flex justify-between items-end mb-6 md:mb-8 px-2 md:px-4">
                                        <div>
                                            <h2 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 text-slate-900 capitalize">
                                                {category}
                                            </h2>
                                            <p className="text-xs md:text-base text-slate-500 mt-1 md:mt-2 font-medium">
                                                Best of {category} collection
                                            </p>
                                        </div>
                                        <Link to={`/products`} className="text-primary hover:text-primary-light transition-colors font-bold flex items-center gap-1 text-sm md:text-base">
                                            View All <FaArrowRight className="text-xs" />
                                        </Link>
                                    </div>
                                    <Slider products={categoryProducts} />
                                </div>
                            );
                        })}
                    </>
                )}
            </section>
        </div>
    );
};

export default HomePage;
