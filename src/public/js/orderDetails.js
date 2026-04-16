const API_BASE = "/api";

// GET ORDER ID FROM URL
const orderId = window.location.pathname.split("/").pop();

// LOAD ORDER DETAILS
const loadOrder = async () => {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const order = data.data;

        // ✅ STATUS
        document.getElementById("orderStatus").innerText = order.status;

        // ✅ ORDER INFO
        document.getElementById("orderInfo").innerHTML = `
      <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Payment:</strong> ${order.paymentStatus}</p>
      <p><strong>Order Date:</strong> ${new Intl.DateTimeFormat(undefined, {
            dateStyle: 'long',
            timeStyle: 'short', // This automatically adds AM/PM based on user settings
            hour12: true        // Forces AM/PM display
        }).format(new Date(order.createdAt))}</p>

    `;

        const itemsContainer = document.getElementById("orderItems");

        if (!order.items || order.items.length === 0) {
            itemsContainer.innerHTML = "<p>No items found</p>";
        } else {
            itemsContainer.innerHTML = order.items.map(item => `
        <div class="card">
          <h3>${item.menuItemId?.name || "Item"}</h3>
          <p>Price: ₹${item.menuItemId?.price || 0}</p>
          <p>Qty: ${item.quantity}</p>
          <p>Total: ₹${(item.menuItemId?.price || 0) * item.quantity}</p>
        </div>
      `).join("");
        }

    } catch (err) {
        console.error(err);
    }
};
// INIT
document.addEventListener("DOMContentLoaded", loadOrder);