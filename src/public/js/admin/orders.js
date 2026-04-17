const token = localStorage.getItem("token");

const loadOrders = async () => {
  const container = document.getElementById("orders");
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;
  try {
    const res = await fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    // response shape: { success, data: [...] } or { success, data: { data: [...] } }
    const orders = data?.data?.data || data?.data || [];
    if (!orders.length) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">No orders found.</p>`;
      return;
    }
    container.innerHTML = `<div class="orders-list">${orders.map(o => `
      <div class="order-card">
        <div class="order-header">
          <div class="order-restaurant">
            <div class="order-restaurant-image">${(o.restaurantId?.name || "R").charAt(0)}</div>
            <div class="order-restaurant-info">
              <h3>${o.restaurantId?.name || "Restaurant"}</h3>
              <p>Order ID: ${o._id}</p>
            </div>
          </div>
          <span class="order-status ${o.status?.toLowerCase().replace(/\s+/g,"-")}">${o.status}</span>
        </div>
        <div style="margin-top:12px;display:flex;align-items:center;gap:12px;">
          <label style="font-size:14px;color:var(--text-muted);">Update status:</label>
          <select onchange="updateStatus('${o._id}', this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-white);color:var(--text-dark);font-family:inherit;">
            <option value="pending" ${o.status==="pending"?"selected":""}>Pending</option>
            <option value="confirmed" ${o.status==="confirmed"?"selected":""}>Confirmed</option>
            <option value="preparing" ${o.status==="preparing"?"selected":""}>Preparing</option>
            <option value="out for delivery" ${o.status==="out for delivery"?"selected":""}>Out for Delivery</option>
            <option value="delivered" ${o.status==="delivered"?"selected":""}>Delivered</option>
            <option value="cancelled" ${o.status==="cancelled"?"selected":""}>Cancelled</option>
          </select>
          <span style="font-weight:700;color:var(--primary);">₹${o.totalAmount || 0}</span>
        </div>
      </div>
    `).join("")}</div>`;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Failed to load orders: ${err.message}</p>`;
  }
};

const updateStatus = async (id, status) => {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Update failed");
  } catch (err) {
    alert("Error: " + err.message);
    loadOrders();
  }
};

document.addEventListener("DOMContentLoaded", loadOrders);