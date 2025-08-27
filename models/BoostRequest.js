const mongoose = require('mongoose');

const BoostRequestSchema = new mongoose.Schema({
  escort: { type: mongoose.Schema.Types.ObjectId, ref: 'Escort' },  
  boostType: { type: String, enum: ['gold', 'silver', 'bronze'], required: true },
  location: { type: String, required: true },
  mpesaRef: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('BoostRequest', BoostRequestSchema);
