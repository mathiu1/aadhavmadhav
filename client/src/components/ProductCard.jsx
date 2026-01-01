import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUrl';
import { FaShoppingCart, FaStar, FaRegHeart, FaHeart, FaSpinner } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../slices/cartSlice';
import { toggleFavorite } from '../slices/authSlice';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const [adding, setAdding] = useState(false);

    const discount = product.oldPrice && product.oldPrice > product.price
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    const isFavorite = userInfo?.favorites?.includes(product._id);

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userInfo) {
            navigate('/login');
            return;
        }
        dispatch(toggleFavorite(product._id));
    };

    const handleAddToCart = () => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        setAdding(true);
        dispatch(addToCart({ ...product, qty: 1, mode: 'increase' }));
        toast.success('Added to cart');
        setTimeout(() => setAdding(false), 1000);
    };

    return (
        <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col h-full group relative overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
            {/* Wishlist Button */}
            <button
                onClick={handleFavorite}
                className={`absolute top-3 right-3 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm transition-all text-xs md:text-sm ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100 opacity-100 translate-y-0' : 'bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-500 hover:bg-white opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0'}`}
            >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>

            {/* Image Container */}
            <div className="h-40 md:h-56 bg-slate-50 rounded-lg md:rounded-xl mb-3 md:mb-4 relative overflow-hidden flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                {discount > 0 && product.countInStock > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-md">
                        -{discount}%
                    </span>
                )}

                {product.countInStock === 0 && (
                    <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Out of Stock
                        </span>
                    </div>
                )}

                <Link to={`/product/${product._id}`} className="w-full h-full flex items-center justify-center p-2 md:p-4">
                    {product.image.startsWith('/images') ? (
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl mb-2">📦</p>
                            <p className="text-[10px] md:text-xs text-slate-500">{product.name}</p>
                        </div>
                    ) : (
                        <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110 ${product.countInStock === 0 ? 'grayscale opacity-70' : ''}`}
                        />
                    )}
                </Link>

                {/* Quick Add Overlay - Desktop (Hover) */}
                <div className="hidden md:block absolute inset-x-4 bottom-4 translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (product.countInStock > 0) handleAddToCart();
                        }}
                        disabled={product.countInStock === 0 || adding}
                        className={`w-full py-3 font-medium text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${product.countInStock === 0
                            ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-black'
                            } ${adding ? 'cursor-wait opacity-80' : ''}`}
                    >
                        {product.countInStock === 0 ? 'Sold Out' : adding ? <><FaSpinner className="animate-spin" /> Adding...</> : <><FaShoppingCart className="text-xs" /> Add to Cart</>}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-grow px-1">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-wider truncate max-w-[80px] md:max-w-none">{product.category}</p>
                    <div className="flex items-center gap-1 text-amber-400 text-[10px] md:text-xs font-medium">
                        <FaStar />
                        <span className="text-slate-500">{product.rating}</span>
                    </div>
                </div>

                <Link to={`/product/${product._id}`} className="hover:text-primary transition-colors block mb-1 md:mb-2">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug truncate">{product.name}</h3>
                </Link>

                <div className="mt-auto flex justify-between items-center">
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <span className="text-base md:text-lg font-bold text-slate-900">{formatCurrency(product.price)}</span>
                        {product.oldPrice > product.price && (
                            <span className="text-xs md:text-sm text-slate-400 line-through decoration-slate-400">{formatCurrency(product.oldPrice)}</span>
                        )}
                    </div>
                </div>

                {/* Mobile Add to Cart Button - Visible only on mobile */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        if (product.countInStock > 0) handleAddToCart();
                    }}
                    disabled={product.countInStock === 0 || adding}
                    className={`md:hidden w-full mt-3 py-2 font-bold text-xs rounded-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 ${product.countInStock === 0
                        ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                        : 'bg-slate-900 text-white'
                        } ${adding ? 'cursor-wait opacity-80' : ''}`}
                >
                    {product.countInStock === 0 ? 'Sold Out' : adding ? <><FaSpinner className="animate-spin" /> Adding...</> : <><FaShoppingCart /> Add to Cart</>}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
