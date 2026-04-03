const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index:true
    },
    status: {
      type: String,
      enum: ["pending", "success","failed","refunded"],
      default: "pending",
      index:true
    },
    method: {
      type: String,
      enum: ["online", "cod"],
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);