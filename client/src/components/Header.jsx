import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUser, FaBars, FaRegHeart } from 'react-icons/fa';

import { BsFillChatSquareDotsFill } from "react-icons/bs";
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart } from '../slices/cartSlice';
import { logout } from '../slices/authSlice';
import { getUnreadCount, incrementUnreadCount } from '../slices/messageSlice';
import { useSocketContext } from '../context/SocketContext';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const searchRef = useRef(null);

    const { socket } = useSocketContext();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }

            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Search Suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (keyword.trim().length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                const { data } = await api.get(`/products?keyword=${keyword}&pageSize=4`);
                setSuggestions(data.products);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [keyword]);

    const cart = useSelector((state) => state.cart);
    // ...

    const { unreadCount } = useSelector((state) => state.messages);

    const submitHandler = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            navigate(`/products?keyword=${keyword}`);
        } else {
            navigate('/products');
        }
    };

    const logoutHandler = () => {
        dispatch(logout());
        navigate('/');
    };
    const { cartItems } = cart;
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (userInfo) {
            dispatch(fetchCart());
            dispatch(getUnreadCount());
        }
    }, [dispatch, userInfo]);

    // Listen for incoming messages to update badge
    useEffect(() => {
        if (socket) {
            socket.on("newMessage", (newMessage) => {
                // Safely handle both populated object and ID string
                const senderId = newMessage.sender._id || newMessage.sender;

                if (senderId !== userInfo._id) {
                    dispatch(incrementUnreadCount());
                }
            });

            socket.on("messagesRead", () => {
                // If messages are read (potentially by another admin), refresh unread count
                if (userInfo) {
                    dispatch(getUnreadCount());
                }
            });

            socket.on("messageDeleted", (payload) => {
                const isObj = typeof payload === 'object' && payload !== null;
                const isUnread = isObj ? payload.isUnread : false;

                if (isUnread && userInfo) {
                    dispatch(getUnreadCount());
                }
            });

            return () => {
                socket.off("newMessage");
                socket.off("messagesRead");
                socket.off("messageDeleted");
            };
        }
    }, [socket, dispatch, userInfo]);

    return (
        <header className="sticky top-0 z-50 pt-2 md:pt-4 px-2 md:px-4 pb-2">
            <nav className="glass-panel rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm">
                {/* Logo */}
                <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-1">
                    <span className="text-primary text-2xl md:text-3xl">▲</span>
                    <span className="text-slate-900 inline xs:hidden">Aadhav</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Madhav</span>
                </Link>

                {/* Search Bar - Hidden on mobile, shown on md+ */}
                {/* Search Bar - Hidden on mobile, shown on md+ */}
                <form ref={searchRef} onSubmit={submitHandler} className="hidden md:flex relative w-1/3 group">
                    <input
                        type="text"
                        placeholder="Search for amazing products..."
                        className="input-field pl-12 pr-4 py-2.5 rounded-full border-slate-200 bg-slate-50 focus:bg-white focus:shadow-md transition-all w-full"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors bg-transparent border-none cursor-pointer">
                        <FaSearch />
                    </button>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl mt-2 border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                            {suggestions.map((product) => (
                                <div
                                    key={product._id}
                                    onMouseDown={() => {
                                        navigate(`/product/${product._id}`);
                                        setKeyword('');
                                        setShowSuggestions(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer"
                                >
                                    <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 object-contain rounded bg-slate-50" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{product.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </form>

                {/* Desktop Nav Actions */}
                <div className="hidden md:flex items-center space-x-6 md:space-x-8">
                    {/* Chat Icon - Only for Admins in Navbar */}
                    {userInfo && userInfo.isAdmin && (
                        <button
                            onClick={() => userInfo.isAdmin ? navigate('/admin/users') : dispatch(toggleChat(true))}
                            className="relative group text-slate-600 hover:text-primary transition-colors"
                        >
                            <BsFillChatSquareDotsFill className="text-xl md:text-2xl" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center animate-pulse shadow-md">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    )}

                    {userInfo && (
                        <Link to="/favorites" className="relative group text-slate-600 hover:text-red-500 transition-colors">
                            <FaRegHeart className="text-xl md:text-2xl" />
                            {userInfo.favorites && userInfo.favorites.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center  shadow-md">
                                    {userInfo.favorites.length}
                                </span>
                            )}
                        </Link>
                    )}

                    <Link to="/cart" className="relative group text-slate-600 hover:text-primary transition-colors">
                        <FaShoppingCart className="text-xl md:text-2xl" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center animate-bounce shadow-md">
                                {cartItems.length}
                            </span>
                        )}
                    </Link>

                    {userInfo ? (
                        <div className="relative group">
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity py-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
                                    {userInfo.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-700 hidden lg:inline">{userInfo.name}</span>
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 w-48 z-50">
                                <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                                    <Link to="/profile" className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-50">
                                        My Profile
                                    </Link>
                                    {userInfo.isAdmin && (
                                        <Link to="/admin/dashboard" className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-50">
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button
                                        onClick={logoutHandler}
                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all text-sm md:text-base">
                            <FaUser />
                            <span>Login</span>
                        </Link>
                    )}
                </div>

                {/* Mobile Icons Group */}
                <div className="flex md:hidden items-center gap-3 sm:gap-4">
                    {userInfo && userInfo.isAdmin && (
                        <button
                            onClick={() => userInfo.isAdmin ? navigate('/admin/users') : dispatch(toggleChat(true))}
                            className="relative text-slate-700"
                        >
                            <BsFillChatSquareDotsFill className="text-xl" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    )}

                    {userInfo && (
                        <Link to="/favorites" className="relative text-slate-700">
                            <FaRegHeart className="text-xl" />
                            {userInfo.favorites && userInfo.favorites.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {userInfo.favorites.length}
                                </span>
                            )}
                        </Link>
                    )}
                    <Link to="/cart" className="relative text-slate-700">
                        <FaShoppingCart className="text-xl" />
                        {cartItems.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                {cartItems.length}
                            </span>
                        )}
                    </Link>

                    <button ref={buttonRef} className="text-slate-700" onClick={() => setIsOpen(!isOpen)}>
                        <FaBars className="text-xl" />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {
                isOpen && (
                    <div ref={menuRef} className="md:hidden glass-panel mt-2 rounded-xl p-4 flex flex-col gap-4 border border-slate-100">
                        <form onSubmit={(e) => {
                            submitHandler(e);
                            setIsOpen(false);
                        }} className="relative z-50">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="input-field py-2 pl-9 rounded-lg text-sm w-full"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs bg-transparent border-none p-0">
                                <FaSearch />
                            </button>

                            {/* Mobile Suggestions */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-xl mt-1 border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                                    {suggestions.map((product) => (
                                        <div
                                            key={product._id}
                                            onMouseDown={() => {
                                                navigate(`/product/${product._id}`);
                                                setKeyword('');
                                                setShowSuggestions(false);
                                                setIsOpen(false);
                                            }}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none cursor-pointer"
                                        >
                                            <img src={getImageUrl(product.image)} alt={product.name} className="w-8 h-8 object-contain rounded bg-slate-50" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>

                        {userInfo ? (
                            <div className="flex flex-col gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                                        {userInfo.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-slate-700">{userInfo.name}</span>
                                </div>
                                <Link to="/profile" onClick={() => setIsOpen(false)} className="text-sm text-slate-600 pl-11 hover:text-primary">My Profile</Link>
                                {userInfo.isAdmin && (
                                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-sm text-slate-600 pl-11 hover:text-primary">Admin Dashboard</Link>
                                )}
                                <button onClick={() => { logoutHandler(); setIsOpen(false); }} className="text-sm text-red-500 pl-11 text-left font-medium">Logout</button>
                            </div>
                        ) : (
                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-slate-700 font-medium">
                                <FaUser /> Login
                            </Link>
                        )}

                        <Link to="/" onClick={() => setIsOpen(false)} className="text-slate-600">Home</Link>
                        <Link to="/products" onClick={() => setIsOpen(false)} className="text-slate-600">All Products</Link>
                    </div>
                )
            }
        </header >
    );
};

export default Header;