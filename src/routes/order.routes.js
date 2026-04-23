const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const {protectJWT} = require('../middlewares/auth.middleware')
const validate = require("../middlewares/validate.middleware");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validators/order.validator");
const authorize = require("../middlewares/role.middleware");

router.get("/admin/all", protectJWT, authorize("admin"), orderController.getAllOrdersAdmin);

router.post(
  "/",
  protectJWT,
  validate(createOrderSchema),
  orderController.placeOrder
);


router.get("/:id",protectJWT, orderController.getOrderById);
router.get("/", protectJWT, orderController.getUserOrders);


router.patch(
  "/:id/status",protectJWT,authorize("admin"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);


module.exports = router;
