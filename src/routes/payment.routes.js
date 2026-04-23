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
const {protectJWT} = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");


router.post("/retry", protectJWT, retryPayment);


router.get("/", protectJWT, authorize("admin"), getAllPayments);
router.get("/all", protectJWT, authorize("admin"), getAllPayments);

router.get("/failed", protectJWT, authorize("admin"), getFailedPayments);


router.post("/refund", protectJWT, authorize("admin"), refundPayment);

router.put("/status", protectJWT, authorize("admin"), updatePaymentStatus);
router.patch("/status", protectJWT, authorize("admin"), updatePaymentStatus);


router.get("/:orderId", protectJWT, getPaymentByOrderId);

module.exports = router;
