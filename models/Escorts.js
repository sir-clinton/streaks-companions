const mongoose = require('mongoose');
const escortSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true},
    weight: {type: String, required: true},
    email: { type: String, required: true, unique: true, index: true},
    password: { type: String, required: true },
    resetToken: String,
    resetTokenExpiry: Date,
    backgroundImg: {type: String, default: 'https://storge.pic2.me/c/1360x800/717/55661ae60b86a.jpg'},
    userImg: { type: String, default: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' },
    about: { type: String, default: '' },
    city: { type: String, required: true },
    place: { type: String},
    dob: { type: Date, required: true },
    orientation: { type: String, required: true},
   location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
        },
    areaLabel: { type: String, required: true },
    gallery: [{ type: String}],
    phone: { type: String, default: '' },
    allowedtopost: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    },
    socialLinks: {
        instagram: { type: String, default: '' },
        twitter: { type: String, default: '' },
        facebook: { type: String, default: '' },
        tiktok: { type: String, default: '' }
    },
    services: [{ type: String, default: '' }],
    availability: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'agency'],default: 'user' },
    agencyName: { type: String, default: null },
    agencyEmail: { type: String, default: null },
    verificationToken: { type: String, default: '' },
    verificationExpires: { type: Date, default: Date.now },
    status: {
        message: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date    }
});
escortSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('profiles', escortSchema);
