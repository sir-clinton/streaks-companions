const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escort',
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  }
});

// Enforce uniqueness per profile-ip combo (only one entry per IP per profile)
profileViewSchema.index({ profile: 1, ipAddress: 1 }, { unique: true });

module.exports = mongoose.model('ProfileView', profileViewSchema);