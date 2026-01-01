import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { addToCart } from '../slices/cartSlice';
import { toggleFavorite } from '../slices/authSlice';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUrl';
import api from '../api/axios';
import { FiMinus, FiPlus, FiAlertCircle, FiCheck, FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import { FaArrowLeft, FaArrowRight, FaCheck, FaStar, FaShoppingCart, FaRegHeart, FaHeart } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';

const Slider = ({ products }) => {
    const sliderRef = useRef();
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const updateWidth = () => {
            if (sliderRef.current) {
                // Calculate max drag boundaries
                const newWidth = sliderRef.current.scrollWidth - sliderRef.current.offsetWidth;
                setWidth(newWidth > 0 ? newWidth + 20 : 0);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        // Small delay to ensure rendering
        const timer = setTimeout(updateWidth, 500);

        return () => {
            window.removeEventListener('resize', updateWidth);
            clearTimeout(timer);
        };
    }, [products]);

    return (
        <div className="relative overflow-hidden p-2 -mx-2 md:p-4 md:-mx-4">
            <motion.div
                ref={sliderRef}
                className="flex gap-4 md:gap-6 cursor-grab active:cursor-grabbing px-2"
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                whileTap={{ cursor: "grabbing" }}
            >
                {products.map((product) => (
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

const ProductPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [relatedProducts, setRelatedProducts] = useState([]);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
                if (data.images && data.images.length > 0) {
                    setSelectedImage(data.images[0]);
                } else {
                    setSelectedImage(data.image);
                }

                // Fetch related products based on category
                if (data && data.category) {
                    const { data: relatedData } = await api.get('/products', {
                        params: {
                            category: data.category,
                            pageSize: 15 // Fetch more to check if view all is needed
                        }
                    });

                    // Filter out current product
                    const filtered = relatedData.products.filter(p => p._id !== data._id);
                    setRelatedProducts(filtered);
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);


    const isFavorite = userInfo?.favorites?.includes(product?._id);

    const handleFavorite = () => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        dispatch(toggleFavorite(product._id));
    };

    const addToCartHandler = () => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        dispatch(addToCart({
            product: id,
            name: product.name,
            image: getImageUrl(product.image),
            price: product.price,
            qty
        }));
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) return (
        <div className="max-w-7xl mx-auto pt-6 px-4 pb-20 overflow-x-hidden animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
                {/* Image Skeleton */}
                <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                    <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-20 h-20 md:w-24 md:h-24 bg-slate-200 rounded-2xl shrink-0"></div>
                        ))}
                    </div>
                    <div className="flex-1 bg-slate-200 rounded-[2rem] h-[500px] order-1 md:order-2 relative"></div>
                </div>

                {/* Details Skeleton */}
                <div className="space-y-8 py-4">
                    <div>
                        <div className="flex gap-2 mb-4">
                            <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                            <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="h-10 md:h-14 w-3/4 bg-slate-200 rounded-xl mb-4"></div>
                        <div className="flex items-center gap-4">
                            <div className="h-5 w-32 bg-slate-200 rounded"></div>
                            <div className="h-5 w-24 bg-slate-200 rounded"></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-40 bg-slate-200 rounded-xl"></div>
                        <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                    </div>

                    <div className="space-y-3 max-w-xl">
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-16">
                        <div className="w-full md:w-32 bg-slate-200 rounded-xl"></div>
                        <div className="w-full md:flex-1 bg-slate-200 rounded-xl"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="h-20 bg-slate-50 rounded-xl"></div>
                        <div className="h-20 bg-slate-50 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto pt-6 px-4 pb-20 overflow-x-hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-8 transition-colors font-medium">
                <FaArrowLeft /> Back to Home
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
                {/* Image Section */}
                <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                    {/* Thumbnails */}
                    {product.images && product.images.length > 0 && (
                        <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 no-scrollbar order-2 md:order-1">
                            {product.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onMouseEnter={() => setSelectedImage(img)}
                                    onClick={() => setSelectedImage(img)}
                                    className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 p-2 cursor-pointer transition-all bg-white shrink-0 ${selectedImage === img
                                        ? 'border-primary shadow-md ring-2 ring-primary/20'
                                        : 'border-slate-100 hover:border-primary/50'
                                        }`}
                                >
                                    <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Main Image */}
                    <div className="flex-1 bg-white rounded-[2rem] p-8 md:p-12 flex items-center justify-center shadow-soft border border-slate-100 relative group overflow-hidden order-1 md:order-2 h-[500px]">
                        <button
                            onClick={handleFavorite}
                            className="absolute top-4 right-4 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-slate-400 hover:text-red-500"
                        >
                            {isFavorite ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl" />}
                        </button>
                        <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                            src={getImageUrl(selectedImage || product.image)}
                            alt={product.name}
                            className="max-h-full w-auto object-contain z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-8 py-4">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide uppercase mb-3">
                            <span className="bg-primary/10 px-3 py-1 rounded-full">{product.category}</span>
                            {product.countInStock > 0 ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1"><FaCheck className="text-xs" /> In Stock</span>
                            ) : (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">Out of Stock</span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">{product.name}</h1>

                        <div className="flex items-center gap-4">
                            <div className="flex text-amber-400 text-lg">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} className={i < Math.floor(product.rating) ? "text-amber-400" : "text-slate-200"} />
                                ))}
                            </div>
                            <span className="text-slate-400 font-medium border-l border-slate-200 pl-4">{product.numReviews} Reviews</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl md:text-5xl font-black text-slate-900">{formatCurrency(product.price)}</span>
                        {product.oldPrice > product.price && (
                            <div className="flex flex-col">
                                <span className="text-lg md:text-xl text-slate-400 line-through decoration-slate-400">{formatCurrency(product.oldPrice)}</span>
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                    {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-600 leading-relaxed text-lg max-w-xl">
                        {product.description}
                    </p>

                    <div className="h-px bg-slate-100 w-full"></div>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        {/* Quantity Selector */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between md:justify-start">
                            <button
                                onClick={() => setQty(Math.max(1, qty - 1))}
                                className="px-6 md:px-5 py-4 md:py-3 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors rounded-l-xl"
                            >-</button>
                            <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
                            <button
                                onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                                className="px-6 md:px-5 py-4 md:py-3 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors rounded-r-xl"
                            >+</button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={addToCartHandler}
                            disabled={product.countInStock === 0}
                            className={`w-full md:flex-1 btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${added ? 'bg-green-600 from-green-600 to-green-500' : ''}`}
                        >
                            {added ? (
                                <>
                                    <FaCheck /> Added to Cart
                                </>
                            ) : (
                                <>
                                    <FaShoppingCart /> Add to Cart
                                </>
                            )}
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg shadow-sm">🚚</div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Free Delivery</p>
                                <p className="text-xs text-slate-500">Orders over {formatCurrency(500)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg shadow-sm">🛡️</div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Secure Payment</p>
                                <p className="text-xs text-slate-500">100% Protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Related Products Section */}
            {
                relatedProducts.length > 0 && (
                    <div className="mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-black text-slate-900">Related Products</h2>
                            {/* Only show view all if we have a lot of products */}
                            {relatedProducts.length > 8 && (
                                <Link
                                    to={`/category/${product.category}`}
                                    className="flex items-center gap-2 text-primary font-bold hover:text-primary-light transition-colors"
                                >
                                    View All <FaArrowRight className="text-sm" />
                                </Link>
                            )}
                        </div>

                        {/* Horizontal Scroll Slider */}
                        <Slider products={relatedProducts.slice(0, 8)} />
                    </div>
                )
            }

            {/* Reviews Section */}
            <div className="mt-20 max-w-4xl">
                <h2 className="text-3xl font-black text-slate-900 mb-8">Customer Reviews</h2>

                {product.reviews.length === 0 ? (
                    <div className="bg-slate-50 p-8 rounded-2xl text-slate-500 border border-slate-100">
                        No reviews yet. Be the first to review this product!
                    </div>
                ) : (
                    <div className="space-y-6">
                        {product.reviews.map((review) => (
                            <div key={review._id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                            {review.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{review.name}</p>
                                            <div className="flex text-amber-400 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < review.rating ? "text-amber-400" : "text-slate-200"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded-lg">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div >
    );
};

export default ProductPage;
