const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const protect = require('../middlewares/auth.middleware')
const validate = require("../middlewares/validate.middleware");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validators/order.validator");
const authorize = require("../middlewares/role.middleware");


router.post(
  "/",
  protect,
  validate(createOrderSchema),
  orderController.placeOrder
);


router.get("/:id",protect, orderController.getOrderById);
router.get("/", protect, orderController.getUserOrders);


router.patch(
  "/:id/status",protect,authorize("admin"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);


module.exports = router;