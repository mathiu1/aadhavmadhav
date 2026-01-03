import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, resetAdminState } from '../../slices/productSlice';
import { FiArrowLeft, FiSave, FiBox, FiLayers, FiImage, FiFileText, FiPercent, FiAlertCircle, FiUpload, FiTrash2 } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import { getImageUrl } from '../../utils/imageUrl';
import api from '../../api/axios';

const CATEGORIES = ['Crackers', 'Custom T-Shirts', 'Nuts', 'General'];

const ProductAddPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [oldPrice, setOldPrice] = useState(0);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [category, setCategory] = useState('General');
    const [countInStock, setCountInStock] = useState(0);
    const [description, setDescription] = useState('');
    const [validationError, setValidationError] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');

    const { createLoading, createSuccess, createError } = useSelector((state) => state.product);

    useEffect(() => {
        if (createSuccess) {
            toast.success('Product created successfully');
            dispatch(resetAdminState());
            navigate('/admin/products');
        }
    }, [dispatch, navigate, createSuccess]);

    const discountPercentage = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

    const uploadFileHandler = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        setUploading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await api.post('/upload', formData, config);

            // data is array of file paths
            // Construct full URL if needed, but relative path is stored in DB
            // Assuming backend returns relative paths like '/uploads/file.jpg'
            // We can prepend server URL if running technically separate, but usually proxy handles it.
            // Let's store what backend returns.
            setImages((prev) => [...prev, ...data]);
            setUploading(false);
            toast.success('Images uploaded!');
        } catch (error) {
            console.error(error);
            setUploading(false);
            toast.error(error.response?.data?.message || 'Upload failed');
        }
    };

    const deleteOldImage = async (imagePath) => {
        if (imagePath && imagePath.includes('/uploads/')) {
            const parts = imagePath.split('/uploads/');
            const filename = parts[parts.length - 1];

            if (!filename || filename.includes('/') || filename.includes('\\')) return;

            try {
                await api.delete(`/upload/${filename}`);
                toast.success('File deleted from server');
            } catch (err) {
                console.error("Failed to delete old image", err);
            }
        }
    };

    const removeImage = (indexToRemove) => {
        const imageToRemove = images[indexToRemove];
        if (imageToRemove) {
            deleteOldImage(imageToRemove);
        }
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const addImageUrlHandler = () => {
        if (!imageUrlInput.trim()) return;

        if (images.length >= 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setImages((prev) => [...prev, imageUrlInput.trim()]);
        setImageUrlInput('');
        toast.success('Image URL added!');
    };

    const submitHandler = (e) => {
        e.preventDefault();
        setValidationError('');

        // Validation
        if (!name || !price || images.length === 0 || !category || !description || countInStock === '') {
            setValidationError('Please fill in all required fields. At least one image is required.');
            toast.error('Please fill in all required fields.');
            return;
        }

        if (Number(oldPrice) > 0 && Number(price) >= Number(oldPrice)) {
            setValidationError('Old price must be greater than the current price.');
            toast.error('Old price must be greater than the current price.');
            return;
        }

        dispatch(createProduct({
            name,
            price: Number(price),
            oldPrice: Number(oldPrice),
            images,
            category,
            description,
            countInStock: Number(countInStock),
            discountPercentage
        }));
    };


    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <Link to="/admin/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-2 transition-colors text-sm uppercase tracking-wide">
                        <FiArrowLeft /> Back to Inventory
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Add <span className="text-primary italic">Product</span>
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submitHandler}
                        disabled={createLoading}
                        className="px-8 py-3 rounded-2xl font-bold text-white bg-primary hover:bg-purple-700 transition-colors shadow-xl shadow-purple-200 flex items-center gap-2"
                    >
                        {createLoading ? 'Creating...' : <><FiSave /> Create Product</>}
                    </button>
                </div>
            </div>

            {createError && (
                <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] border border-red-100 flex items-center gap-4 mb-8">
                    <span className="font-bold">{createError}</span>
                </div>
            )}

            {validationError && (
                <div className="bg-amber-50 text-amber-600 p-6 rounded-[2rem] border border-amber-100 flex items-center gap-4 mb-8 animate-shake">
                    <FiAlertCircle size={20} />
                    <span className="font-bold">{validationError}</span>
                </div>
            )}

            <form onSubmit={submitHandler} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: General Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Details Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiBox className="text-primary" /> General Information
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                    placeholder="E.g. Mega Sparkle Flower Pot"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                                <div className="relative card-select-wrapper">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                                        <FiLayers />
                                    </div>
                                    <select
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                                <div className="relative">
                                    <div className="absolute top-5 left-5 pointer-events-none text-slate-400">
                                        <FiFileText />
                                    </div>
                                    <textarea
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[160px] resize-none leading-relaxed"
                                        placeholder="Write a compelling description for the product..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Inventory Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FaRupeeSign className="text-primary" /> Pricing & Inventory
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Old Price (MSRP)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 font-bold">
                                        ₹
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-500 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all line-through decoration-slate-400"
                                        placeholder="0.00"
                                        value={oldPrice}
                                        onChange={(e) => setOldPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-900 font-bold">
                                        ₹
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stock Quantity</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        onWheel={(e) => e.target.blur()}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                        placeholder="0"
                                        value={countInStock}
                                        onChange={(e) => setCountInStock(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-slate-400 text-xs font-bold uppercase">
                                        Units
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Media & Publish */}
                <div className="space-y-8">
                    {/* Image Upload Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <FiImage className="text-primary" /> Product Media
                        </h2>

                        <div className="space-y-4">
                            {/* Upload Button */}
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary transition-all group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FiUpload className="w-8 h-8 text-slate-400 group-hover:text-primary mb-2 transition-colors" />
                                        <p className="text-xs font-bold text-slate-400 group-hover:text-slate-600">
                                            {uploading ? 'Uploading...' : 'Click to Upload Images'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">Max 5 images (JPG, PNG)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        onChange={uploadFileHandler}
                                        disabled={uploading || images.length >= 5}
                                    />
                                </label>
                            </div>

                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase my-2">
                                <span className="h-px bg-slate-200 flex-1"></span>
                                OR
                                <span className="h-px bg-slate-200 flex-1"></span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                    placeholder="Paste image URL..."
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    // Allow submitting on Enter key if desired, but button is safer
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addImageUrlHandler();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addImageUrlHandler}
                                    disabled={!imageUrlInput.trim() || images.length >= 5}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                            </div>

                            {/* Image Grid */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                            <img src={getImageUrl(img)} alt={`Product ${index}`} className="w-full h-full object-cover" />

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                            >
                                                <FiTrash2 size={12} />
                                            </button>

                                            {/* Badge for Main Image */}
                                            {index === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] font-bold text-center py-1 backdrop-blur-sm">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {images.length === 0 && (
                                <p className="text-xs text-center text-slate-400 font-bold py-4">
                                    No images uploaded yet.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stock Status & Offer */}
                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
                        <h3 className="text-lg font-black text-primary mb-4">Stock Status & Offer</h3>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Final Price</p>
                                    <p className="text-xl font-black text-slate-900">{formatCurrency(price)}</p>
                                </div>
                                {oldPrice > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MSRP</p>
                                        <p className="text-sm font-bold text-slate-400 line-through decoration-slate-400">{formatCurrency(oldPrice)}</p>
                                    </div>
                                )}
                            </div>

                            {countInStock > 0 ? (
                                <div className="flex items-center gap-3 text-emerald-600 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="font-bold">In Stock ({countInStock})</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-red-500 bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="font-bold">Out of Stock</span>
                                </div>
                            )}

                            {discountPercentage > 0 && (
                                <div className="flex items-center gap-3 text-amber-600 bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
                                    <FiPercent className="text-xl" />
                                    <div className="flex flex-col">
                                        <span className="font-black text-lg">{discountPercentage}% Discount</span>
                                        <span className="text-[10px] font-bold text-amber-400 uppercase">Applied automatically</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductAddPage;
