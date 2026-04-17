const token = localStorage.getItem("token");

const loadPayments = async () => {
  const container = document.getElementById("payments");
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;
  try {
    const res = await fetch("/api/payments", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const payments = data?.data?.data || data?.data || [];
    if (!payments.length) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">No payments found.</p>`;
      return;
    }
    container.innerHTML = `
      <div class="orders-list">
        ${payments.map(p => `
          <div class="order-card" style="cursor:default;">
            <div class="order-header">
              <div class="order-restaurant">
                <div class="order-restaurant-image" style="font-size:20px;">💳</div>
                <div class="order-restaurant-info">
                  <h3>₹${p.amount ?? 0}</h3>
                  <p>Order: ${p.orderId?._id || p.orderId || "N/A"}</p>
                </div>
              </div>
              <span class="order-status ${p.status === "success" ? "delivered" : p.status === "failed" ? "cancelled" : "pending"}">${p.status}</span>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:24px;font-size:13px;color:var(--text-muted);">
              <span>Method: <strong>${p.method || "N/A"}</strong></span>
              <span>Date: <strong>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}</strong></span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Failed to load payments: ${err.message}</p>`;
  }
};

document.addEventListener("DOMContentLoaded", loadPayments);