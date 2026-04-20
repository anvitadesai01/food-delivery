const dashboardToken = localStorage.getItem("token");

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const chartColors = ["#fc8019", "#0f9d58", "#2563eb", "#7c3aed", "#dc3545", "#f59e0b"];

const renderStatCards = (summary) => {
  const cards = [
    { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), tone: "accent" },
    { label: "Platform Orders", value: summary.totalOrders || 0 },
    { label: "Active Orders", value: summary.activeOrders || 0 },
    { label: "Pending Payments", value: summary.pendingPayments || 0 },
    { label: "Restaurants", value: summary.totalRestaurants || 0 },
    { label: "Users", value: summary.totalUsers || 0, meta: `${summary.monthGrowth || 0}% monthly growth` },
  ];

  return cards
    .map(
      (card) => `
        <article class="admin-stat-card ${card.tone === "accent" ? "admin-stat-card-accent" : ""}">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>${card.meta || "Live dashboard signal"}</small>
        </article>
      `
    )
    .join("");
};

const renderLineChart = (trends = []) => {
  if (!trends.length) {
    return `<p class="admin-empty">No trend data available.</p>`;
  }

  const width = 640;
  const height = 240;
  const padding = 28;
  const maxRevenue = Math.max(...trends.map((item) => item.totalRevenue || 0), 1);
  const maxOrders = Math.max(...trends.map((item) => item.totalOrders || 0), 1);
  const xStep = trends.length > 1 ? (width - padding * 2) / (trends.length - 1) : 0;

  const revenuePoints = trends
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height - padding - ((item.totalRevenue || 0) / maxRevenue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const ordersPoints = trends
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height - padding - ((item.totalOrders || 0) / maxOrders) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <div class="chart-card">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis"></line>
        <polyline class="chart-line chart-line-primary" points="${revenuePoints}"></polyline>
        <polyline class="chart-line chart-line-secondary" points="${ordersPoints}"></polyline>
        ${trends
          .map((item, index) => {
            const x = padding + index * xStep;
            const revenueY =
              height - padding - ((item.totalRevenue || 0) / maxRevenue) * (height - padding * 2);
            const orderY =
              height - padding - ((item.totalOrders || 0) / maxOrders) * (height - padding * 2);
            return `
              <circle cx="${x}" cy="${revenueY}" r="4" class="chart-dot chart-dot-primary"></circle>
              <circle cx="${x}" cy="${orderY}" r="4" class="chart-dot chart-dot-secondary"></circle>
            `;
          })
          .join("")}
      </svg>
      <div class="chart-legend">
        <span><i class="legend-dot legend-primary"></i> Revenue</span>
        <span><i class="legend-dot legend-secondary"></i> Orders</span>
      </div>
      <div class="chart-label-row">
        ${trends.map((item) => `<span>${item.label}</span>`).join("")}
      </div>
    </div>
  `;
};

const renderRingChart = (rows = [], emptyMessage, totalLabel) => {
  if (!rows.length) {
    return `<p class="admin-empty">${emptyMessage}</p>`;
  }

  const total = rows.reduce((sum, row) => sum + (row.count || 0), 0) || 1;
  let cumulative = 0;
  const segments = rows
    .map((row, index) => {
      const percent = (row.count || 0) / total;
      const start = cumulative * 360;
      cumulative += percent;
      return `${chartColors[index % chartColors.length]} ${start}deg ${cumulative * 360}deg`;
    })
    .join(", ");

  return `
    <div class="ring-card">
      <div class="ring-chart" style="background: conic-gradient(${segments});">
        <div class="ring-chart-inner">
          <strong>${total}</strong>
          <span>${totalLabel}</span>
        </div>
      </div>
      <div class="ring-legend">
        ${rows
          .map(
            (row, index) => `
              <div class="ring-legend-item">
                <span><i class="legend-dot" style="background:${chartColors[index % chartColors.length]}"></i>${row._id}</span>
                <strong>${row.count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
};

const renderSimpleTable = (rows, columns, emptyMessage) => {
  if (!rows.length) {
    return `<p class="admin-empty">${emptyMessage}</p>`;
  }

  const header = columns.map((column) => `<th>${column.label}</th>`).join("");
  const body = rows
    .map(
      (row) => `
        <tr>
          ${columns.map((column) => `<td>${column.render(row)}</td>`).join("")}
        </tr>
      `
    )
    .join("");

  return `
    <table class="admin-table">
      <thead><tr>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
};

const renderActivityFeed = (items, renderItem, emptyMessage) => {
  if (!items.length) {
    return `<p class="admin-empty">${emptyMessage}</p>`;
  }

  return items.map(renderItem).join("");
};

const loadDashboard = async () => {
  try {
    const response = await fetch("/api/analytics/dashboard/overview", {
      headers: {
        Authorization: `Bearer ${dashboardToken}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to load dashboard");
    }

    const payload = result.data;
    document.getElementById("dashboardStats").innerHTML = renderStatCards(payload.summary);
    document.getElementById("trendChart").innerHTML = renderLineChart(payload.trends || []);
    document.getElementById("orderMixChart").innerHTML = renderRingChart(
      payload.orderStatusBreakdown || [],
      "No order distribution available.",
      "orders"
    );
    document.getElementById("paymentMixChart").innerHTML = renderRingChart(
      payload.paymentStatusBreakdown || [],
      "No payment distribution available.",
      "payments"
    );
    document.getElementById("topRestaurants").innerHTML = renderSimpleTable(
      payload.topRestaurants || [],
      [
        { label: "Restaurant", render: (row) => row.restaurantName || "-" },
        { label: "Revenue", render: (row) => formatCurrency(row.totalRevenue) },
        { label: "Orders", render: (row) => row.totalOrders || 0 },
      ],
      "No restaurant performance data found."
    );
    document.getElementById("topItems").innerHTML = renderSimpleTable(
      payload.topItems || [],
      [
        { label: "Item", render: (row) => row.name || "-" },
        { label: "Ordered", render: (row) => row.totalOrdered || 0 },
        { label: "Price", render: (row) => formatCurrency(row.price) },
      ],
      "No item demand data found."
    );
    document.getElementById("recentOrders").innerHTML = renderActivityFeed(
      payload.recentOrders || [],
      (order) => `
        <article class="feed-card">
          <div>
            <strong>${order.restaurantId?.name || "Restaurant"}</strong>
            <p>${order.userId?.name || "Customer"} • ${order.userId?.email || "No email"}</p>
          </div>
          <div class="feed-meta">
            <span class="status-badge status-${order.status}">${order.status}</span>
            <strong>${formatCurrency(order.totalAmount)}</strong>
          </div>
        </article>
      `,
      "No recent orders yet."
    );
    document.getElementById("recentPayments").innerHTML = renderActivityFeed(
      payload.recentPayments || [],
      (payment) => `
        <article class="feed-card">
          <div>
            <strong>${payment.orderId?.restaurantId?.name || "Restaurant"}</strong>
            <p>${payment.method || "N/A"} • ${new Date(payment.createdAt).toLocaleString("en-IN")}</p>
          </div>
          <div class="feed-meta">
            <span class="status-badge status-${payment.status}">${payment.status}</span>
            <strong>${formatCurrency(payment.orderId?.totalAmount || 0)}</strong>
          </div>
        </article>
      `,
      "No recent payments yet."
    );
  } catch (error) {
    document.getElementById("dashboardStats").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

document.addEventListener("DOMContentLoaded", loadDashboard);
