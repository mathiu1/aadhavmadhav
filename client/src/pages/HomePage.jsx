import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSiteConfig } from '../slices/contentSlice'; // Import action
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import { FaFire, FaArrowRight, FaStar } from 'react-icons/fa';

// Fallback slides in case of API failure or initial load delay
const defaultSlides = [
    {
        id: 1,
        badge: '✨ Trendsetting Fashion',
        title: 'Wear Your',
        highlight: 'Vibe.',
        description: 'Premium t-shirts and apparel crafted for comfort and style.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
        bgColor: 'from-purple-50 to-pink-50'
    }
];

const defaultCards = [
    {
        id: 'apparel',
        title: 'Apparel',
        subtitle: 'Custom Fit',
        image: 'https://plus.unsplash.com/premium_photo-1701204056531-f82d31308f1f?q=80&w=687&auto=format&fit=crop',
        link: '/products',
        buttonText: 'Explore Collection'
    },
    {
        id: 'crackers',
        title: 'Crackers',
        subtitle: 'Light up the night',
        image: 'https://images.unsplash.com/photo-1563303313-93627cc2a1aa?q=80&w=1170&auto=format&fit=crop',
        link: '/products'
    },
    {
        id: 'nuts',
        title: 'Nuts & Dry Fruits',
        subtitle: 'Healthy Snacking',
        image: 'https://plus.unsplash.com/premium_photo-1726768984120-f476b15835f2?q=80&w=1169&auto=format&fit=crop',
        link: '/products'
    },
    {
        id: 'promo',
        title: 'Wait!',
        subtitle: 'Get 20% off on first order.',
        promoCode: 'Use Code: FIRST20',
        buttonText: 'Grab Code'
    }
];

const Slider = ({ products }) => {
    const sliderRef = useRef();
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const updateWidth = () => {
            if (sliderRef.current) {
                const newWidth = sliderRef.current.scrollWidth - sliderRef.current.offsetWidth;
                setWidth(newWidth > 0 ? newWidth + 20 : 0);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
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
    const dispatch = useDispatch();
    const { config, loading: configLoading } = useSelector((state) => state.content);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        dispatch(getSiteConfig());

        const fetchProducts = async () => {
            try {
                const { data } = await api.get('/products?pageSize=100');
                const shuffled = (data.products || []).sort(() => 0.5 - Math.random());
                setProducts(shuffled);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchProducts();
    }, [dispatch]);

    // Use config slides or fallback
    const activeSlides = config?.heroSlides?.length > 0 ? config.heroSlides : defaultSlides;
    const cards = config?.categoryCards?.length > 0 ? config.categoryCards : defaultCards;

    const [direction, setDirection] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const slideVariants = {
        enter: (direction) => ({
            zIndex: 0,
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const paginate = (newDirection) => {
        setDirection(newDirection);
        setCurrentSlide((prev) => (prev + newDirection + activeSlides.length) % activeSlides.length);
    };

    // Auto Slider Logic
    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            paginate(1);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeSlides.length, isPaused]);

    if (configLoading && !config) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12 md:space-y-24 pb-20">
            {/* Auto-Slider Hero Section */}
            <section
                className="relative h-[400px] md:h-[600px] w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-900 shadow-soft border border-slate-100 group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
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
                        onDragStart={() => setIsPaused(true)}
                        onDragEnd={(e, { offset, velocity }) => {
                            setIsPaused(false);
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
                                src={activeSlides[currentSlide].image}
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
                                        {activeSlides[currentSlide].badge}
                                    </span>
                                    <h1 className="text-3xl md:text-7xl font-black leading-tight tracking-tight text-white mb-2 md:mb-4 drop-shadow-lg">
                                        {activeSlides[currentSlide].title} <br />
                                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeSlides[currentSlide].bgColor}`}>
                                            {activeSlides[currentSlide].highlight}
                                        </span>
                                    </h1>
                                    <p className="text-xs md:text-xl text-slate-200 font-medium max-w-lg mb-4 md:mb-8 leading-relaxed drop-shadow-md line-clamp-2 md:line-clamp-none">
                                        {activeSlides[currentSlide].description}
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

                {/* Slider Dots (Mobile Optimized) */}
                <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 max-w-[80%]">
                    <div className="flex gap-2 px-3 py-2 rounded-full bg-slate-900/30 backdrop-blur-xl border border-white/10 items-center overflow-x-auto no-scrollbar mask-gradient">
                        {activeSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    const newDirection = index > currentSlide ? 1 : -1;
                                    setDirection(newDirection);
                                    setCurrentSlide(index);
                                }}
                                className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ease-out flex-shrink-0 ${currentSlide === index
                                    ? 'bg-white w-6 md:w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                    : 'bg-white/30 w-1.5 md:w-2 hover:bg-white/60 hover:scale-125'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Grid (Dynamic) */}
            <section className="container mx-auto">
                <div className="flex justify-center mb-6 md:mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900 text-center relative inline-block">
                        Shop by Category
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 md:w-12 h-1 bg-primary rounded-full"></div>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 h-auto md:h-[500px]">
                    {/* Item 0: Main (Large) */}
                    {cards[0] && (
                        <Link to={cards[0].link} className="md:col-span-2 md:row-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[200px] md:h-auto">
                            <img src={cards[0].image} alt={cards[0].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-white">
                                <p className="text-[10px] md:text-sm font-bold bg-white/20 backdrop-blur-md inline-block px-2 md:px-3 py-1 rounded-lg mb-1 md:mb-2">{cards[0].subtitle}</p>
                                <h3 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">{cards[0].title}</h3>
                                <p className="text-xs md:text-base text-slate-200 group-hover:translate-x-2 transition-transform duration-300">{cards[0].buttonText || 'Explore'} &rarr;</p>
                            </div>
                        </Link>
                    )}

                    {/* Item 1: Tall */}
                    {cards[1] && (
                        <Link to={cards[1].link} className="md:col-span-1 md:row-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[180px] md:h-auto">
                            <img src={cards[1].image} alt={cards[1].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-xl md:text-2xl font-bold mb-1">{cards[1].title}</h3>
                                <p className="text-[10px] md:text-xs text-slate-300">{cards[1].subtitle}</p>
                            </div>
                        </Link>
                    )}

                    {/* Item 2: Square Top */}
                    {cards[2] && cards[2].isEnabled !== false && (
                        <Link to={cards[2].link} className={`md:col-span-1 ${cards[3]?.isEnabled === false ? 'md:row-span-2' : 'md:row-span-1'} group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[150px] md:h-auto`}>
                            <img src={cards[2].image} alt={cards[2].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="text-xl md:text-2xl font-bold mb-1">{cards[2].title}</h3>
                                <p className="text-xs md:text-sm text-slate-300">{cards[2].subtitle} &rarr;</p>
                            </div>
                        </Link>
                    )}

                    {/* Item 3: Square Bottom (Promo) */}
                    {cards[3] && cards[3].isEnabled !== false && (
                        <div className="md:col-span-1 md:row-span-1 rounded-2xl md:rounded-3xl bg-secondary text-white p-6 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-pink-200 h-[150px] md:h-auto">
                            <div className="relative z-10">
                                <p className="font-bold opacity-80 mb-1 text-xs">Limited Offer</p>
                                <h3 className="text-2xl md:text-3xl font-black mb-1 md:mb-2">{cards[3].title}</h3>
                                <p className="text-xs md:text-sm font-medium mb-3 md:mb-4">{cards[3].subtitle}</p>
                                <button className="bg-white text-secondary px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-slate-100 transition-colors">{cards[3].buttonText || 'Grab Code'}</button>
                            </div>
                            <div className="absolute -right-2 -top-2 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -left-2 -bottom-2 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
                        </div>
                    )}
                </div>

                {/* Additional Dynamic Cards */}
                {cards.length > 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-4 md:mt-6">
                        {cards.slice(4).map((card, index) => (
                            card.isEnabled !== false && (
                                <Link key={index + 4} to={card.link} className="group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-[150px] md:h-[200px]">
                                    <img src={card.image} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl md:text-2xl font-bold mb-1">{card.title}</h3>
                                        <p className="text-xs md:text-sm text-slate-300">{card.subtitle} &rarr;</p>
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>
                )}
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
