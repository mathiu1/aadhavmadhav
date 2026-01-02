const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
    badge: { type: String, default: 'New Arrival' },
    title: { type: String, default: 'Welcome' },
    highlight: { type: String, default: '' }, // The colored/gradient text
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    bgColor: { type: String, default: 'from-purple-50 to-pink-50' }
});

const categoryCardSchema = new mongoose.Schema({
    id: { type: String, required: true }, // 'apparel', 'crackers', 'nuts', 'promo'
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    link: { type: String, default: '/products' },
    promoCode: { type: String, default: '' }, // For the promo card
    buttonText: { type: String, default: 'Shop Now' },
    isEnabled: { type: Boolean, default: true } // Toggle visibility
});

const siteConfigSchema = new mongoose.Schema({
    heroSlides: [heroSlideSchema],
    categoryCards: [categoryCardSchema],
    taxRate: { type: Number, default: 0.18 }, // e.g. 0.18 for 18%
    freeDeliveryThreshold: { type: Number, default: 500 },
    shippingPrice: { type: Number, default: 40 }
}, { timestamps: true });

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

module.exports = SiteConfig;
