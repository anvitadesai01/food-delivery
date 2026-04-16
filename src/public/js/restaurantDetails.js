const API_BASE = "/api";

// GET ID FROM URL
const restaurantId = window.location.pathname.split("/").pop();

// FETCH RESTAURANT DETAILS
const loadRestaurant = async () => {
    try {
        const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
        const data = await res.json();

        const r = data.data;

        document.getElementById("restaurantInfo").innerHTML = `
      <h1>${r.name}</h1>
      <p>${r.location}</p>
      <p>${r.cuisine.join(", ")}</p>
      <span>⭐ ${r.rating}</span>
    `;
    } catch (err) {
        console.error(err);
    }
};

// FETCH MENU
const loadMenu = async () => {
    try {
        const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu`);
        const data = await res.json();

        const menu = data.data;

        const container = document.getElementById("menuList");

        if (!menu.length) {
            container.innerHTML = "<p>No items available</p>";
            return;
        }

        container.innerHTML = menu
            .map(
                (item) => `
        <div class="card">
          <div class="card-body">
            <h3>${item.name}</h3>
            <p>₹${item.price}</p>
            <small>${item.availability ? "Available" : "Out of stock"}</small>
            
            <button onclick="addToCart('${item._id}')" class="btn-primary">
              Add to Cart
            </button>
          </div>
        </div>
      `
            )
            .join("");
    } catch (err) {
        console.error(err);
    }
};

// ADD TO CART (UI ONLY)
const addToCart = async (menuItemId) => {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch("/api/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                menuItemId,
                quantity: 1,
            }),
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        alert("Added to cart ✅");

        // 🔥 refresh navbar count
        location.reload();

    } catch (err) {
        console.error(err);
    }
};

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadRestaurant();
    loadMenu();
});