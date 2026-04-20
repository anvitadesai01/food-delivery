const orderToken = localStorage.getItem("token");
const orderState = {
  page: 1,
  limit: 10,
};

const orderCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const nextActions = {
  placed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const renderPagination = (pagination) => {
  const container = document.getElementById("ordersPagination");
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  if (totalPages <= 1) {
    container.innerHTML = totalItems ? `<span class="pagination-summary">${totalItems} records</span>` : "";
    return;
  }

  const pages = [];
  const pushPage = (page) => {
    pages.push(`<button class="pagination-btn ${page === currentPage ? "active" : ""}" onclick="changeOrderPage(${page})">${page}</button>`);
  };
  const pushEllipsis = (key) => {
    pages.push(`<span class="pagination-ellipsis" data-key="${key}">...</span>`);
  };

  pushPage(1);

  if (currentPage > 3) {
    pushEllipsis("left");
  }

  for (
    let page = Math.max(2, currentPage - 1);
    page <= Math.min(totalPages - 1, currentPage + 1);
    page += 1
  ) {
    pushPage(page);
  }

  if (currentPage < totalPages - 2) {
    pushEllipsis("right");
  }

  if (totalPages > 1) {
    pushPage(totalPages);
  }

  container.innerHTML = `
    <span class="pagination-summary">Showing page ${currentPage} of ${totalPages}</span>
    <div class="pagination-actions">
      <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changeOrderPage(${currentPage - 1})">Prev</button>
      ${pages.join("")}
      <button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changeOrderPage(${currentPage + 1})">Next</button>
    </div>
  `;
};

const renderOrderSummary = (summary = {}) => {
  document.getElementById("orderSummary").innerHTML = [
    { label: "Total Orders", value: summary.totalOrders || 0 },
    { label: "Active Orders", value: summary.activeOrders || 0 },
    { label: "Delivered", value: summary.deliveredOrders || 0 },
    { label: "Pending Payments", value: summary.pendingPayments || 0 },
  ]
    .map(
      (card) => `
        <article class="admin-stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>Operational order signal</small>
        </article>
      `
    )
    .join("");
};

const loadOrders = async () => {
  const status = document.getElementById("orderStatusFilter").value;
  const paymentStatus = document.getElementById("paymentStatusFilter").value;
  const params = new URLSearchParams({
    page: String(orderState.page),
    limit: String(orderState.limit),
  });

  if (status) params.set("status", status);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);

  try {
    const response = await fetch(`/api/orders/admin/all?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${orderToken}`,
      },
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to load orders");
    }

    const orders = result?.data?.data || [];
    renderOrderSummary(result?.data?.summary || {});
    renderPagination(result?.data?.pagination || {});
    document.getElementById("ordersList").innerHTML = orders.length
      ? orders
          .map((order) => {
            const actions = nextActions[order.status] || [];

            return `
              <article class="feed-card feed-card-large">
                <div class="feed-card-main">
                  <div>
                    <strong>${order.restaurantId?.name || "Restaurant"}</strong>
                    <p>${order.userId?.name || "Customer"} • ${order.userId?.email || "No email"}</p>
                    <small>${new Date(order.createdAt).toLocaleString("en-IN")}</small>
                  </div>
                  <div class="feed-meta">
                    <span class="status-badge status-${order.status}">${order.status}</span>
                    <span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span>
                    <strong>${orderCurrency(order.totalAmount)}</strong>
                  </div>
                </div>
                <div class="feed-card-sub">
                  <span>${order.items?.length || 0} items</span>
                  <span>Order ID: ${order._id}</span>
                </div>
                <div class="table-actions">
                  ${
                    actions.length
                      ? actions
                          .map(
                            (action) => `
                              <button class="btn-outline btn-small" onclick="updateOrderStatus('${order._id}', '${action}')">
                                Mark as ${action}
                              </button>
                            `
                          )
                          .join("")
                      : `<span class="admin-muted">No further actions</span>`
                  }
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="admin-empty">No orders found for the selected filters.</p>`;
  } catch (error) {
    document.getElementById("ordersList").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

window.changeOrderPage = (page) => {
  orderState.page = page;
  loadOrders();
};

window.updateOrderStatus = async (id, status) => {
  try {
    const response = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${orderToken}`,
      },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update order");
    }

    window.showAppToast({
      title: `Order marked as ${status}`,
      icon: "success",
    });
    loadOrders();
  } catch (error) {
    window.showAppAlert({
      title: "Update failed",
      text: error.message,
      icon: "error",
    });
  }
};

document.getElementById("orderStatusFilter")?.addEventListener("change", () => {
  orderState.page = 1;
  loadOrders();
});
document.getElementById("paymentStatusFilter")?.addEventListener("change", () => {
  orderState.page = 1;
  loadOrders();
});
document.getElementById("orderPageSize")?.addEventListener("change", (event) => {
  orderState.limit = Number(event.target.value);
  orderState.page = 1;
  loadOrders();
});

document.addEventListener("DOMContentLoaded", loadOrders);
