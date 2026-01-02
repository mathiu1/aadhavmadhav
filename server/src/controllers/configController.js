const asyncHandler = require('express-async-handler');
const SiteConfig = require('../models/SiteConfig');

// @desc    Get site configuration (public)
// @route   GET /api/config
// @access  Public
const getSiteConfig = asyncHandler(async (req, res) => {
    // There should only be one config doc
    const config = await SiteConfig.findOne();

    if (config) {
        res.json(config);
    } else {
        // Return default structure if not found (or create one)
        res.json({
            heroSlides: [],
            categoryCards: []
        });
    }
});

// @desc    Update site configuration
// @route   PUT /api/config
// @access  Private/Admin
const updateSiteConfig = asyncHandler(async (req, res) => {
    const { heroSlides, categoryCards, taxRate, freeDeliveryThreshold, shippingPrice } = req.body;

    let config = await SiteConfig.findOne();

    if (config) {
        config.heroSlides = heroSlides || config.heroSlides;
        config.categoryCards = categoryCards || config.categoryCards;
        if (taxRate !== undefined) config.taxRate = taxRate;
        if (freeDeliveryThreshold !== undefined) config.freeDeliveryThreshold = freeDeliveryThreshold;
        if (shippingPrice !== undefined) config.shippingPrice = shippingPrice;

        const updatedConfig = await config.save();
        res.json(updatedConfig);
    } else {
        const newConfig = await SiteConfig.create({
            heroSlides,
            categoryCards,
            taxRate: taxRate !== undefined ? taxRate : 0.18,
            freeDeliveryThreshold: freeDeliveryThreshold !== undefined ? freeDeliveryThreshold : 500,
            shippingPrice: shippingPrice !== undefined ? shippingPrice : 40
        });
        res.status(201).json(newConfig);
    }
});

// @desc    Initialize default config (internal/seed)
const initConfig = asyncHandler(async (req, res) => {
    const count = await SiteConfig.countDocuments();
    if (count === 0) {
        // Create default data matching current hardcoded values
        await SiteConfig.create({
            heroSlides: [
                {
                    badge: '✨ Trendsetting Fashion',
                    title: 'Wear Your',
                    highlight: 'Vibe.',
                    description: 'Premium t-shirts and apparel crafted for comfort and style.',
                    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
                    bgColor: 'from-purple-50 to-pink-50'
                },
                {
                    badge: '🎆 Celebration Special',
                    title: 'Ignite The',
                    highlight: 'Celebration.',
                    description: 'Dazzling sky-shots and premium crackers for your special moments.',
                    image: 'https://images.unsplash.com/photo-1538374184611-910aa0465442?q=80&w=1624&auto=format&fit=crop',
                    bgColor: 'from-orange-50 to-red-50'
                },
                {
                    badge: '🌿 Premium Nutrition',
                    title: 'The Art of',
                    highlight: 'Healthy Snacking.',
                    description: 'Hand-selected almonds, cashews, and walnuts.',
                    image: 'https://images.unsplash.com/photo-1542990253-a781e04c0082?q=80&w=1094&auto=format&fit=crop',
                    bgColor: 'from-amber-50 to-yellow-50'
                }
            ],
            categoryCards: [
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
            ],
            taxRate: 0.18,
            freeDeliveryThreshold: 500
        });
        res.json({ message: 'Initialized default config' });
    } else {
        res.json({ message: 'Config already exists' });
    }
});

module.exports = {
    getSiteConfig,
    updateSiteConfig,
    initConfig
};
