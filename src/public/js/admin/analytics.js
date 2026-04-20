const analyticsToken = localStorage.getItem("token");
const analyticColors = ["#fc8019", "#0f9d58", "#2563eb", "#7c3aed", "#dc3545"];

const analyticsCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const makeTable = (rows, columns, emptyMessage) => {
  if (!rows.length) return `<p class="admin-empty">${emptyMessage}</p>`;

  return `
    <table class="admin-table">
      <thead><tr>${columns.map((column) => `<th>${column.label}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) => `
              <tr>${columns.map((column) => `<td>${column.render(row)}</td>`).join("")}</tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
};

const renderBarList = (rows, key, formatter, emptyMessage) => {
  if (!rows.length) return `<p class="admin-empty">${emptyMessage}</p>`;

  const maxValue = Math.max(...rows.map((row) => row[key] || 0), 1);

  return rows
    .map(
      (row, index) => `
        <div class="metric-row">
          <div class="metric-row-head">
            <strong>${row.restaurantName || row.name || "-"}</strong>
            <span>${formatter(row[key] || 0)}</span>
          </div>
          <div class="metric-row-track">
            <div class="metric-row-fill" style="width:${((row[key] || 0) / maxValue) * 100}%; background:${analyticColors[index % analyticColors.length]}"></div>
          </div>
        </div>
      `
    )
    .join("");
};

const renderLineChart = (rows = []) => {
  if (!rows.length) return `<p class="admin-empty">No monthly trend data available.</p>`;

  const width = 760;
  const height = 260;
  const padding = 30;
  const maxRevenue = Math.max(...rows.map((item) => item.totalRevenue || 0), 1);
  const maxOrders = Math.max(...rows.map((item) => item.totalOrders || 0), 1);
  const xStep = rows.length > 1 ? (width - padding * 2) / (rows.length - 1) : 0;

  const makePointString = (key, maxValue) =>
    rows
      .map((item, index) => {
        const x = padding + index * xStep;
        const y = height - padding - ((item[key] || 0) / maxValue) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

  const revenuePoints = makePointString("totalRevenue", maxRevenue);
  const orderPoints = makePointString("totalOrders", maxOrders);

  return `
    <div class="chart-card">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis"></line>
        <polyline class="chart-line chart-line-primary" points="${revenuePoints}"></polyline>
        <polyline class="chart-line chart-line-secondary" points="${orderPoints}"></polyline>
        ${rows
          .map((item, index) => {
            const x = padding + index * xStep;
            const revenueY =
              height - padding - ((item.totalRevenue || 0) / maxRevenue) * (height - padding * 2);
            const ordersY =
              height - padding - ((item.totalOrders || 0) / maxOrders) * (height - padding * 2);
            return `
              <circle cx="${x}" cy="${revenueY}" r="4" class="chart-dot chart-dot-primary"></circle>
              <circle cx="${x}" cy="${ordersY}" r="4" class="chart-dot chart-dot-secondary"></circle>
            `;
          })
          .join("")}
      </svg>
      <div class="chart-legend">
        <span><i class="legend-dot legend-primary"></i> Revenue</span>
        <span><i class="legend-dot legend-secondary"></i> Orders</span>
      </div>
      <div class="chart-label-row">
        ${rows.map((item) => `<span>${String(item._id.month).padStart(2, "0")}/${item._id.year}</span>`).join("")}
      </div>
    </div>
  `;
};

const renderRingChart = (sections, totalLabel) => {
  if (!sections.length) return `<p class="admin-empty">No status data available.</p>`;

  const total = sections.reduce((sum, item) => sum + item.count, 0) || 1;
  let current = 0;
  const stops = sections
    .map((item, index) => {
      const start = current * 360;
      current += item.count / total;
      return `${analyticColors[index % analyticColors.length]} ${start}deg ${current * 360}deg`;
    })
    .join(", ");

  return `
    <div class="ring-card">
      <div class="ring-chart" style="background: conic-gradient(${stops});">
        <div class="ring-chart-inner">
          <strong>${total}</strong>
          <span>${totalLabel}</span>
        </div>
      </div>
      <div class="ring-legend">
        ${sections
          .map(
            (item, index) => `
              <div class="ring-legend-item">
                <span><i class="legend-dot" style="background:${analyticColors[index % analyticColors.length]}"></i>${item._id}</span>
                <strong>${item.count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
};

const loadAnalytics = async () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  const endDate = new Date().toISOString();

  try {
    const [revenueRes, itemsRes, trendsRes, overviewRes] = await Promise.all([
      fetch("/api/analytics/revenue?limit=10&page=1", {
        headers: { Authorization: `Bearer ${analyticsToken}` },
      }),
      fetch("/api/analytics/most-ordered-items", {
        headers: { Authorization: `Bearer ${analyticsToken}` },
      }),
      fetch(`/api/analytics/trends/monthly?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: { Authorization: `Bearer ${analyticsToken}` },
      }),
      fetch("/api/analytics/dashboard/overview", {
        headers: { Authorization: `Bearer ${analyticsToken}` },
      }),
    ]);

    const [revenueData, itemsData, trendsData, overviewData] = await Promise.all([
      revenueRes.json(),
      itemsRes.json(),
      trendsRes.json(),
      overviewRes.json(),
    ]);

    if (!revenueData.success || !itemsData.success || !trendsData.success || !overviewData.success) {
      throw new Error("Unable to load analytics");
    }

    const revenueRows = revenueData?.data?.data || [];
    const itemsRows = itemsData?.data || [];
    const trendsRows = trendsData?.data || [];
    const overviewPayload = overviewData?.data || {};
    const overview = overviewPayload.summary || {};

    document.getElementById("analyticsSummary").innerHTML = [
      { label: "Total Revenue", value: analyticsCurrency(overview.totalRevenue) },
      { label: "Avg Order Value", value: analyticsCurrency(overview.averageOrderValue) },
      { label: "Successful Orders", value: overview.successfulOrders || 0 },
      { label: "Failed Payments", value: overview.failedPayments || 0 },
    ]
      .map(
        (card) => `
          <article class="admin-stat-card">
            <span>${card.label}</span>
            <strong>${card.value}</strong>
            <small>Updated from live analytics</small>
          </article>
        `
      )
      .join("");

    document.getElementById("analyticsLineChart").innerHTML = renderLineChart(trendsRows);
    document.getElementById("monthlyTrend").innerHTML = renderLineChart(trendsRows);
    document.getElementById("analyticsStatusMix").innerHTML = `
      ${renderRingChart(overviewPayload.orderStatusBreakdown || [], "orders")}
      ${renderRingChart(overviewPayload.paymentStatusBreakdown || [], "payments")}
    `;

    document.getElementById("revenueBars").innerHTML = renderBarList(
      revenueRows,
      "totalRevenue",
      analyticsCurrency,
      "No revenue performance data available."
    );
    document.getElementById("itemsBars").innerHTML = renderBarList(
      itemsRows,
      "totalOrdered",
      (value) => `${value} orders`,
      "No item demand data available."
    );

    document.getElementById("revenueTable").innerHTML = makeTable(
      revenueRows,
      [
        { label: "Restaurant", render: (row) => row.restaurantName || "-" },
        { label: "Revenue", render: (row) => analyticsCurrency(row.totalRevenue) },
        { label: "Orders", render: (row) => row.totalOrders || 0 },
        { label: "Avg Order", render: (row) => analyticsCurrency(row.averageOrderValue || 0) },
      ],
      "No revenue data available."
    );

    document.getElementById("itemsTable").innerHTML = makeTable(
      itemsRows,
      [
        { label: "Menu Item", render: (row) => row.name || "-" },
        { label: "Units Ordered", render: (row) => row.totalOrdered || 0 },
        { label: "Price", render: (row) => analyticsCurrency(row.price || 0) },
      ],
      "No item trends available."
    );
  } catch (error) {
    document.getElementById("analyticsSummary").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

document.addEventListener("DOMContentLoaded", loadAnalytics);
