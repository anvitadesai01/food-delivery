const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true 
  },
  items: [
    {
      menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
        required: true  
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ]
}, { timestamps: true,
    versionKey:false
 });

module.exports = mongoose.model("Cart", cartSchema);