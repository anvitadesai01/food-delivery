const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  location: {
    type: String,
    required: true,
    index: true
  },
  cuisine: {
    type: [String],
    required: true,
    index: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

restaurantSchema.index({ location: 1, cuisine: 1 })

module.exports = mongoose.model('Restaurant', restaurantSchema)
