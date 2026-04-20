const paymentToken = localStorage.getItem("token");
const paymentState = {
  page: 1,
  limit: 10,
};

const paymentCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const renderPagination = (pagination) => {
  const container = document.getElementById("paymentsPagination");
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  if (totalPages <= 1) {
    container.innerHTML = totalItems ? `<span class="pagination-summary">${totalItems} records</span>` : "";
    return;
  }

  const pages = [];
  const pushPage = (page) => {
    pages.push(`<button class="pagination-btn ${page === currentPage ? "active" : ""}" onclick="changePaymentPage(${page})">${page}</button>`);
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
      <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changePaymentPage(${currentPage - 1})">Prev</button>
      ${pages.join("")}
      <button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changePaymentPage(${currentPage + 1})">Next</button>
    </div>
  `;
};

const renderPaymentSummary = (summary = {}) => {
  document.getElementById("paymentSummary").innerHTML = [
    { label: "Total Payments", value: summary.totalPayments || 0 },
    { label: "Successful", value: summary.successCount || 0 },
    { label: "Pending", value: summary.pendingCount || 0 },
    { label: "Refunded", value: summary.refundedCount || 0 },
  ]
    .map(
      (card) => `
        <article class="admin-stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>Financial operations signal</small>
        </article>
      `
    )
    .join("");
};

const loadPayments = async () => {
  try {
    const response = await fetch(`/api/payments?page=${paymentState.page}&limit=${paymentState.limit}`, {
      headers: {
        Authorization: `Bearer ${paymentToken}`,
      },
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to load payments");
    }

    const payments = result?.data?.data || [];
    renderPaymentSummary(result?.data?.summary || {});
    renderPagination(result?.data?.pagination || {});
    document.getElementById("paymentsList").innerHTML = payments.length
      ? payments
          .map(
            (payment) => `
              <article class="feed-card feed-card-large">
                <div class="feed-card-main">
                  <div>
                    <strong>${payment.orderId?.restaurantId?.name || "Restaurant"}</strong>
                    <p>${payment.orderId?.userId?.name || "Customer"} • ${payment.method || "N/A"}</p>
                    <small>${new Date(payment.createdAt).toLocaleString("en-IN")}</small>
                  </div>
                  <div class="feed-meta">
                    <span class="status-badge status-${payment.status}">${payment.status}</span>
                    <strong>${paymentCurrency(payment.orderId?.totalAmount || 0)}</strong>
                  </div>
                </div>
                <div class="feed-card-sub">
                  <span>Order ID: ${payment.orderId?._id || "N/A"}</span>
                  <span>Order Status: ${payment.orderId?.status || "N/A"}</span>
                </div>
                <div class="table-actions">
                  ${
                    payment.status === "success"
                      ? `<button class="btn-outline btn-small" onclick="refundPayment('${payment.orderId?._id}')">Refund Payment</button>`
                      : `<span class="admin-muted">No action available</span>`
                  }
                </div>
              </article>
            `
          )
          .join("")
      : `<p class="admin-empty">No payments found.</p>`;
  } catch (error) {
    document.getElementById("paymentsList").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

window.changePaymentPage = (page) => {
  paymentState.page = page;
  loadPayments();
};

window.refundPayment = async (orderId) => {
  const confirmed = await window.confirmAppAction({
    title: "Process refund?",
    text: "This payment will be marked as refunded.",
    confirmButtonText: "Refund",
  });
  if (!confirmed) return;

  try {
    const response = await fetch("/api/payments/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paymentToken}`,
      },
      body: JSON.stringify({ orderId }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Refund failed");
    }

    window.showAppToast({ title: "Refund processed", icon: "success" });
    loadPayments();
  } catch (error) {
    window.showAppAlert({
      title: "Refund failed",
      text: error.message,
      icon: "error",
    });
  }
};

document.getElementById("paymentPageSize")?.addEventListener("change", (event) => {
  paymentState.limit = Number(event.target.value);
  paymentState.page = 1;
  loadPayments();
});

document.addEventListener("DOMContentLoaded", loadPayments);
