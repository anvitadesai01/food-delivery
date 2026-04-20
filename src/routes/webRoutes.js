const express = require("express");
const router = express.Router();
const { protectPage } = require("../middlewares/auth.middleware");
const { authorizePage } = require("../middlewares/role.middleware");

// ─── Public Pages ─────────────────────────────────────────────────────────────

router.get("/", (req, res) => res.render("pages/home", { title: "Home", currentPath: req.path }));
router.get("/login", (req, res) => res.render("pages/login", { title: "Login", currentPath: req.path }));
router.get("/register", (req, res) => res.render("pages/register", { title: "Register", currentPath: req.path }));
router.get("/restaurants", (req, res) => res.render("pages/restaurants", { title: "Restaurants" }));
router.get("/menu", (req, res) => res.render("pages/menu", { title: "Menu - Dishes" }));
router.get("/restaurants/:id", (req, res) => res.render("pages/restaurantDetails", { title: "Restaurant Details" }));
router.get("/cart", protectPage, (req, res) => res.render("pages/cart", { title: "Cart" }));
router.get("/orders", protectPage, (req, res) => res.render("pages/orders", { title: "Orders" }));
router.get("/orders/:id", protectPage, (req, res) => res.render("pages/orderDetails", { title: "Order Details" }));

// ─── Admin Pages ──────────────────────────────────────────────────────────────

router.get("/admin/dashboard", protectPage, authorizePage("admin"), (req, res) => res.render("admin/dashboard", { title: "Admin Dashboard", currentPath: req.path }));
router.get("/admin/restaurants", protectPage, authorizePage("admin"), (req, res) => res.render("admin/restaurants", { title: "Admin | Restaurants", currentPath: req.path }));
router.get("/admin/menu", protectPage, authorizePage("admin"), (req, res) => res.render("admin/menu", { title: "Admin | Menu", currentPath: req.path }));
router.get("/admin/orders", protectPage, authorizePage("admin"), (req, res) => res.render("admin/orders", { title: "Admin | Orders", currentPath: req.path }));
router.get("/admin/analytics", protectPage, authorizePage("admin"), (req, res) => res.render("admin/analytics", { title: "Admin | Analytics", currentPath: req.path }));
router.get("/admin/payments", protectPage, authorizePage("admin"), (req, res) => res.render("admin/payments", { title: "Admin | Payments", currentPath: req.path }));

module.exports = router;
