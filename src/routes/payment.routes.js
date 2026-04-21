const express = require("express");
const router = express.Router();
const {
  getPaymentByOrderId,
  retryPayment,
  getAllPayments,
  getFailedPayments,
  refundPayment,
  updatePaymentStatus,
} = require("../controllers/payment.controller");
const protect = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");


router.post("/retry", protect, retryPayment);


router.get("/", protect, authorize("admin"), getAllPayments);
router.get("/all", protect, authorize("admin"), getAllPayments);

router.get("/failed", protect, authorize("admin"), getFailedPayments);


router.post("/refund", protect, authorize("admin"), refundPayment);

router.put("/status", protect, authorize("admin"), updatePaymentStatus);
router.patch("/status", protect, authorize("admin"), updatePaymentStatus);


router.get("/:orderId", protect, getPaymentByOrderId);

module.exports = router;
