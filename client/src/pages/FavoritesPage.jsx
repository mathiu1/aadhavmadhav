import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { FaHeart, FaSpinner, FaArrowLeft, FaTrash } from 'react-icons/fa';
import api from '../api/axios';
import { toggleFavorite } from '../slices/authSlice';
import { getImageUrl } from '../utils/imageUrl';

const FavoritesPage = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!userInfo) {
                setLoading(false);
                navigate('/login');
                return;
            }
            try {
                const { data } = await api.get('/users/profile/favorites', { withCredentials: true });
                setFavorites(data); // Expecting array of populated product objects
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [userInfo, navigate]);

    // Update favorites filtering when userInfo.favorites changes (e.g. toggled off)
    useEffect(() => {
        if (favorites.length > 0 && userInfo?.favorites) {
            setFavorites(prev => prev.filter(p => userInfo.favorites.includes(p._id)));
        }
    }, [userInfo?.favorites]);


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-4xl text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors">
                <FaArrowLeft /> Back to Home
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <FaHeart className="text-xl md:text-2xl" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800">My Favorites</h1>
                    <p className="text-slate-500 text-sm">{favorites.length} items saved</p>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <FaHeart className="text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">No favorites yet</h2>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">Start exploring our amazing products and save the ones you love!</p>
                    <Link to="/products" className="btn-primary inline-flex items-center gap-2">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {favorites.map((product) => {
                        if (product.isDeleted) {
                            return (
                                <div key={product._id} className="relative bg-slate-50 rounded-3xl border border-slate-200 p-4 opacity-75 group/inactive">
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={() => dispatch(toggleFavorite(product._id))}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Remove from favorites"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                    <div className="h-48 bg-white rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-slate-100 grayscale-[80%]">
                                        <img src={getImageUrl(product.image)} alt={product.name} className="h-full w-full object-contain p-4 opacity-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-slate-400 truncate cursor-not-allowed">{product.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                Unavailable
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return <ProductCard key={product._id} product={product} />;
                    })}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
