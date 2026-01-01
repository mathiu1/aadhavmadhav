import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts, fetchFilters } from '../slices/productSlice';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaSearch, FaTimes, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const AllProductsPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // Parse Query Params
    const searchParams = new URLSearchParams(location.search);
    const keywordParam = searchParams.get('keyword') || '';

    // Redux State
    const { products, page, pages, isLoading, error, filters } = useSelector((state) => state.product);

    // Local Filter State
    const [pageNumber, setPageNumber] = useState(1);
    const [category, setCategory] = useState('');
    const [priceRange, setPriceRange] = useState([0, 1000]); // Visual state for Slider
    const [finalPriceRange, setFinalPriceRange] = useState([0, 1000]); // Committed state for API call
    const [rating, setRating] = useState(0);
    const [showFilters, setShowFilters] = useState(false); // Mobile toggle

    // Initialize Filters (Global or Category specific)
    useEffect(() => {
        dispatch(fetchFilters(category));
    }, [dispatch, category]);

    // Update local price range when server filters load
    useEffect(() => {
        if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
            // Reset price range to the new category's full range
            setPriceRange([filters.minPrice, filters.maxPrice]);
            setFinalPriceRange([filters.minPrice, filters.maxPrice]);
        }
    }, [filters]);

    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(fetchProducts({
            keyword: keywordParam, // Use URL param for initial fetch
            pageNumber,
            category,
            minPrice: finalPriceRange[0],
            maxPrice: finalPriceRange[1],
            rating
        }));
    }, [dispatch, keywordParam, pageNumber, category, finalPriceRange, rating]);

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="container mx-auto px-4 py-8 flex items-start gap-8">
                {/* Sidebar Filters (Desktop) */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 md:translate-x-0 md:shadow-none md:bg-white md:z-auto md:sticky md:top-28 md:max-h-[calc(100vh-10rem)] md:overflow-y-auto md:rounded-2xl md:p-6 md:border md:border-slate-100 ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 md:p-0 h-full overflow-y-auto md:overflow-visible">
                        <div className="flex justify-between md:hidden mb-6">
                            <h2 className="text-xl font-bold">Filters</h2>
                            <button onClick={() => setShowFilters(false)}><FaTimes className="text-slate-500" /></button>
                        </div>

                        {/* Active Filters Chips (Sidebar) */}
                        {(keywordParam || category || rating > 0 || (filters.minPrice !== undefined && (finalPriceRange[0] !== filters.minPrice || finalPriceRange[1] !== filters.maxPrice))) && (
                            <div className="mb-6 border-b border-slate-100 pb-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Active Filters</h3>
                                <div className="flex flex-wrap gap-2">
                                    {keywordParam && (
                                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            Search: {keywordParam}
                                            <button onClick={() => navigate('/products')} className="hover:text-purple-900 ml-1"><FaTimes /></button>
                                        </div>
                                    )}
                                    {category && (
                                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            Category: {category}
                                            <button onClick={() => setCategory('')} className="hover:text-blue-900 ml-1"><FaTimes /></button>
                                        </div>
                                    )}
                                    {rating > 0 && (
                                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            {rating}+ Star
                                            <button onClick={() => setRating(0)} className="hover:text-amber-900 ml-1"><FaTimes /></button>
                                        </div>
                                    )}
                                    {(filters.minPrice !== undefined && (finalPriceRange[0] !== filters.minPrice || finalPriceRange[1] !== filters.maxPrice)) && (
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            ₹{finalPriceRange[0]} - ₹{finalPriceRange[1]}
                                            <button onClick={() => {
                                                setPriceRange([filters.minPrice, filters.maxPrice]);
                                                setFinalPriceRange([filters.minPrice, filters.maxPrice]);
                                            }} className="hover:text-green-900 ml-1"><FaTimes /></button>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            navigate('/products');
                                            setCategory('');
                                            setRating(0);
                                            if (filters.minPrice !== undefined) {
                                                setPriceRange([filters.minPrice, filters.maxPrice]);
                                                setFinalPriceRange([filters.minPrice, filters.maxPrice]);
                                            }
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold underline mt-2"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Category Filter */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Categories</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="category"
                                        value=""
                                        checked={category === ''}
                                        onChange={() => setCategory('')}
                                        className="accent-primary"
                                    />
                                    <span className={`text-slate-600 group-hover:text-primary transition-colors ${category === '' ? 'font-bold text-primary' : ''}`}>All Categories</span>
                                </label>
                                {filters.categories.map((cat) => (
                                    <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            value={cat}
                                            checked={category === cat}
                                            onChange={() => setCategory(cat)}
                                            className="accent-primary"
                                        />
                                        <span className={`text-slate-600 group-hover:text-primary transition-colors ${category === cat ? 'font-bold text-primary' : ''}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Price Range</h3>
                            <div className="px-2">
                                <Slider
                                    range
                                    min={filters.minPrice}
                                    max={filters.maxPrice}
                                    value={priceRange}
                                    onChange={(value) => setPriceRange(value)}
                                    onAfterChange={(value) => setFinalPriceRange(value)}
                                    trackStyle={{ backgroundColor: '#7C3AED', height: 6 }}
                                    handleStyle={{ borderColor: '#7C3AED', backgroundColor: '#fff', opacity: 1 }}
                                    railStyle={{ backgroundColor: '#e2e8f0', height: 6 }}
                                />
                                <div className="flex justify-between text-sm text-slate-500 mt-3 font-medium">
                                    <span>₹{priceRange[0]}</span>
                                    <span>₹{priceRange[1]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Min Rating</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="rating"
                                        value="0"
                                        checked={rating === 0}
                                        onChange={() => setRating(0)}
                                        className="accent-primary"
                                    />
                                    <span className={`text-slate-600 group-hover:text-primary transition-colors ${rating === 0 ? 'font-bold text-primary' : ''}`}>Any Rating</span>
                                </label>
                                {[4, 3, 2, 1].map((r) => (
                                    <label key={r} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="rating"
                                            value={r}
                                            checked={rating === r}
                                            onChange={() => setRating(r)}
                                            className="accent-primary"
                                        />
                                        <div className="flex items-center gap-1 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar key={i} className={i < r ? "" : "text-slate-300"} />
                                            ))}
                                            <span className="text-slate-500 text-sm ml-1">& Up</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Overlay for Mobile Sidebar */}
                {showFilters && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setShowFilters(false)}
                    ></div>
                )}

                {/* Main Content Grid */}
                <main className="flex-1">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 h-[400px] border border-slate-100 flex flex-col gap-4">
                                    <div className="h-40 md:h-56 bg-slate-200 rounded-lg md:rounded-xl"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                        <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                                    <div className="flex justify-between items-center mt-auto">
                                        <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                                        <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                            Error: {error}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {products.map((product, index) => (
                                        <motion.div
                                            key={product._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination */}
                            {/* Pagination */}
                            {pages > 1 && (
                                <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-slate-100">
                                    <div className="text-sm text-slate-500 font-medium mb-4 md:mb-0">
                                        Showing Page <span className="text-primary font-bold">{page}</span> of <span className="text-slate-900 font-bold">{pages}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPageNumber(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaChevronLeft size={12} />
                                        </button>

                                        {(() => {
                                            const pageNumbers = [];
                                            const maxVisible = 5;

                                            if (pages <= 5) {
                                                for (let i = 1; i <= pages; i++) pageNumbers.push(i);
                                            } else {
                                                if (page < 4) {
                                                    pageNumbers.push(1, 2, 3, 4, '...', pages);
                                                } else if (page > pages - 3) {
                                                    pageNumbers.push(1, '...', pages - 3, pages - 2, pages - 1, pages);
                                                } else {
                                                    pageNumbers.push(1, '...', page - 1, page, page + 1, '...', pages);
                                                }
                                            }

                                            return pageNumbers.map((pageNum, idx) => (
                                                pageNum === '...' ? (
                                                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-300 font-bold tracking-widest">...</span>
                                                ) : (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPageNumber(pageNum)}
                                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all transform active:scale-95 ${page === pageNum
                                                            ? 'bg-primary text-white shadow-lg shadow-purple-500/30 ring-2 ring-primary ring-offset-2'
                                                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-primary/30 hover:text-primary'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            ));
                                        })()}

                                        <button
                                            onClick={() => setPageNumber(Math.min(pages, page + 1))}
                                            disabled={page === pages}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaChevronRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {products.length === 0 && (
                                <div className="text-center py-20 text-slate-400">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-bold text-slate-600">No products found</h3>
                                    <p>Try adjusting your search or filters</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Mobile Filter Toggle Button (Floating) */}
            <button
                onClick={() => setShowFilters(true)}
                className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 bg-gradient-to-tr from-slate-800 to-slate-900 text-white rounded-full shadow-[0_4px_15px_rgba(15,23,42,0.5)] border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
                <FaFilter className="w-5 h-5" />
            </button>
        </div >
    );
};

export default AllProductsPage;