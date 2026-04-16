const loadOrders = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    // ✅ SAFETY CHECK
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    const orders = data.data || [];

    const container = document.getElementById("ordersList");

    if (!orders.length) {
      container.innerHTML = "<p>No orders yet</p>";
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="card" onclick="goToOrder('${order._id}')">
        <h3>${order.restaurantId?.name || "Restaurant"}</h3>
        <p>₹${order.totalAmount}</p>
        <p>Status: ${order.status}</p>
        <p>Payment: ${order.paymentStatus}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);

    document.getElementById("ordersList").innerHTML =
      "<p style='color:red'>Failed to load orders</p>";
  }
};

const goToOrder = (id) => {
  window.location.href = `/orders/${id}`;
};

document.addEventListener("DOMContentLoaded", loadOrders);