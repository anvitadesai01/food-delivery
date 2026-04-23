const API_BASE = "/api";

const loadCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    const res = await fetch(`${API_BASE}/cart`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();
    const cart = data.data;
    renderCart(cart.items || []);
};

const renderCart = (items) => {
    const container = document.getElementById("cartItems");
    const summaryDiv = document.getElementById("cartSummary");

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet</p>
                <a href="/restaurants" class="btn-primary">Browse Restaurants</a>
            </div>
        `;
        summaryDiv.style.display = "none";
        return;
    }

    summaryDiv.style.display = "block";

    let subtotal = 0;

    container.innerHTML = `
        <div class="cart-header">
            <span class="cart-title">Cart Items</span>
            <span class="cart-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>
    ` + items.map(item => {
        const price = item.menuItemId?.price || 0;
        const qty = item.quantity || 1;
        const itemTotal = price * qty;
        subtotal += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">🍴</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.menuItemId?.name || 'Item'}</div>
                    <div class="cart-item-price"><span>₹${price}</span> × ${qty}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty('${item.menuItemId._id}', ${qty - 1}, ${qty})">−</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn" onclick="updateQty('${item.menuItemId._id}', ${qty + 1}, ${qty})">+</button>
                    </div>
                    <span style="min-width: 60px; text-align: right; font-weight: 600;">₹${itemTotal.toFixed(2)}</span>
                    <button class="remove-btn" onclick="removeItem('${item.menuItemId._id}', ${qty})">🗑️</button>
                </div>
            </div>
        `;
    }).join("");

    const taxes = Math.round(subtotal * 0.05);
    const deliveryFee = 40;
    const total = subtotal + taxes + deliveryFee;

    document.getElementById("subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("taxes").textContent = `₹${taxes.toFixed(2)}`;
    document.getElementById("totalAmount").textContent = `₹${total.toFixed(2)}`;
};

const updateQty = async (menuItemId, newQty, oldQty) => {
    if (newQty < 1) {
        removeItem(menuItemId, oldQty);
        return;
    }

    const token = localStorage.getItem("token");
    const change = newQty - oldQty;

    await fetch(`${API_BASE}/cart`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItemId, quantity: newQty }),
    });

    updateCartBadge(change);
    loadCart();
};

const removeItem = async (menuItemId, oldQty) => {
    const token = localStorage.getItem("token");

    await fetch(`${API_BASE}/cart/${menuItemId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    updateCartBadge(-oldQty);
    loadCart();
};

document.addEventListener("DOMContentLoaded", loadCart);

const placeOrder = async () => {
    try {
        const token = localStorage.getItem("token");
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

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
            await window.showAppAlert({
                title: "Order failed",
                text: data.message,
                icon: "error",
            });
            return;
        }

        window.showAppToast({ title: "Order placed successfully", icon: "success" });
        setTimeout(() => {
            window.location.href = `/orders/${data.data._id}`;
        }, 1500);

    } catch (err) {
        console.error(err);
        window.showAppAlert({
            title: "Something went wrong",
            text: "Please try again.",
            icon: "error",
        });
    }
};
