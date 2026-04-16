const API_BASE = "/api";

// FETCH CART
const loadCart = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/cart`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    const cart = data.data;

    renderCart(cart.items || []);
};

// RENDER CART
const renderCart = (items) => {
    const container = document.getElementById("cartItems");   // ✅ FIXED
    const summary = document.getElementById("totalAmount");   // ✅ FIXED

    if (!items.length) {
        container.innerHTML = "<p>Your cart is empty</p>";
        summary.innerHTML = "";
        return;
    }

    let total = 0;

    container.innerHTML = items.map(item => {
        const price = item.menuItemId.price;
        const qty = item.quantity;

        total += price * qty;

        return `
      <div class="cart-item">
        <div class="cart-info">
          <h3>${item.menuItemId.name}</h3>
          <p>₹${price}</p>
        </div>

        <div class="cart-actions">
          <button onclick="updateQty('${item.menuItemId._id}', ${qty - 1})">-</button>
          <span>${qty}</span>
          <button onclick="updateQty('${item.menuItemId._id}', ${qty + 1})">+</button>
        </div>

        <button onclick="removeItem('${item.menuItemId._id}')">❌</button>
      </div>
    `;
    }).join("");

    summary.innerHTML = `Total: ₹${total.toFixed(2)}`;
};
// UPDATE QTY
const updateQty = async (menuItemId, quantity) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/cart`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId, quantity }),
    });

    loadCart();
};

// REMOVE ITEM
const removeItem = async (menuItemId) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/cart/${menuItemId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    loadCart();
};

// INIT
document.addEventListener("DOMContentLoaded", loadCart);

const placeOrder = async () => {
    try {
        const token = localStorage.getItem("token");
        const paymentMethod = document.getElementById("paymentMethod").value;

        const res = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentMethod }),
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        alert("Order placed successfully 🎉");

        // ✅ redirect to order tracking page
        window.location.href = `/orders/${data.data._id}`;

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
};