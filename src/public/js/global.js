// ===============================
// AUTH UTILITIES
// ===============================

// Check login
const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

// Logout (GLOBAL)
window.logout = function () {
  localStorage.removeItem("token");

  // prevent back navigation
  window.location.replace("/login");
};

// Protect routes
const protectRoute = () => {
  const publicRoutes = ["/","/login", "/register"];
  const path = window.location.pathname;

  if (!isLoggedIn() && !publicRoutes.includes(path)) {
    window.location.replace("/login");
  }
};

// Prevent back after logout
window.addEventListener("pageshow", function (event) {
  if (event.persisted || window.performance.navigation.type === 2) {
    if (!isLoggedIn()) {
      window.location.replace("/login");
    }
  }
});

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  protectRoute();
});

const getCartCount = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success || !data.data.items) return 0;

    // total quantity
    return data.data.items.reduce((acc, item) => acc + item.quantity, 0);
  } catch (err) {
    console.error(err);
    return 0;
  }
};