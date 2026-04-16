const express = require("express");
const router = express.Router();

const { getAllRestaurants } = require("../controllers/restaurant.controller");

// HOME
router.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Home",
    currentPath: req.path
  });
});

// LOGIN
router.get("/login", (req, res) => {
  res.render("pages/login", {
    title: "Login",
    currentPath: req.path
  });
});

// REGISTER
router.get("/register", (req, res) => {
  res.render("pages/register", {
    title: "Register",
    currentPath: req.path
  });
});

router.get("/restaurants", (req, res) => {
  res.render("pages/restaurants", { title: "Restaurants" });
});

router.get("/restaurants/:id", (req, res) => {
  res.render("pages/restaurantDetails", {
    title: "Restaurant Details",
  });
});

router.get("/cart", (req, res) => {
  res.render("pages/cart", {
    title: "Cart",
  });
});

router.get("/orders/:id", (req, res) => {
  res.render("pages/orderDetails", {
    title: "Order Details",
  });
});

router.get("/orders", (req, res) => {
  res.render("pages/orders", {
    title: "Orders",
  });
});

module.exports = router;