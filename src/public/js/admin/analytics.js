const token = localStorage.getItem("token");

const loadAnalytics = async () => {
  const container = document.getElementById("analytics");
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;
  try {
    const res = await fetch("/api/analytics/revenue", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    // response shape: { success, data: { data: [...] } } or { success, data: [...] }
    const records = data?.data?.data || data?.data || [];
    if (!records.length) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">No analytics data available.</p>`;
      return;
    }
    container.innerHTML = records.map(r => `
      <div class="restaurant-card" style="cursor:default;">
        <div class="restaurant-content">
          <div class="restaurant-name" style="margin-bottom:12px;">${r.restaurantName || "Restaurant"}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--text-muted);">Total Revenue</span>
              <span style="font-weight:700;color:var(--primary);">₹${r.totalRevenue ?? 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--text-muted);">Total Orders</span>
              <span style="font-weight:600;">${r.totalOrders ?? 0}</span>
            </div>
            ${r.averageOrderValue != null ? `
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span style="color:var(--text-muted);">Avg Order Value</span>
              <span style="font-weight:600;">₹${r.averageOrderValue.toFixed(2)}</span>
            </div>` : ""}
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Failed to load analytics: ${err.message}</p>`;
  }
};

document.addEventListener("DOMContentLoaded", loadAnalytics);