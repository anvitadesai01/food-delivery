const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let totalItems = 0;
let allOrders = [];

const renderPagination = (total, current, perPage) => {
  const container = document.getElementById("paginationContainer");
  const totalPages = Math.ceil(total / perPage);
  
  if (totalPages <= 1) {
    container.style.display = "none";
    return;
  }
  
  container.style.display = "flex";
  
  let html = `
    <button class="pagination-btn nav-btn" onclick="goToPage(${current - 1})" ${current === 1 ? 'disabled' : ''}>
      ← Prev
    </button>
  `;
  
  const maxVisible = 5;
  let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="pagination-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }
    html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }
  
  html += `
    <button class="pagination-btn nav-btn" onclick="goToPage(${current + 1})" ${current === totalPages ? 'disabled' : ''}>
      Next →
    </button>
  `;
  
  html += `<span class="pagination-info">Page ${current} of ${totalPages} (${total} orders)</span>`;
  
  container.innerHTML = html;
};

const loadOrders = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    const res = await fetch("/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    allOrders = data.data || [];
    totalItems = allOrders.length;
    
    const params = new URLSearchParams(window.location.search);
    if (params.has('page')) {
      currentPage = parseInt(params.get('page')) || 1;
    }

    const container = document.getElementById("ordersList");

    if (!allOrders.length) {
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
          <div style="font-size: 100px; margin-bottom: 24px;">📦</div>
          <h3 style="font-size: 24px; margin-bottom: 12px;">No orders yet</h3>
          <p style="color: var(--text-muted); margin-bottom: 32px;">Your order history will appear here</p>
          <a href="/restaurants" class="btn-primary">Order Food Now</a>
        </div>
      `;
      document.getElementById("paginationContainer").style.display = "none";
      return;
    }

    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedOrders = sortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    container.innerHTML = paginatedOrders.map(order => {
      const statusClass = order.status?.toLowerCase().replace(/\s+/g, '-') || 'pending';
      const firstLetter = order.restaurantId?.name?.charAt(0) || 'R';
      const orderDate = new Date(order.createdAt);
      const formattedDate = orderDate.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      const formattedTime = orderDate.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return `
        <div class="order-card" onclick="goToOrder('${order._id}')">
          <div class="order-header">
            <div class="order-restaurant">
              <div class="order-restaurant-image">${firstLetter}</div>
              <div class="order-restaurant-info">
                <h3>${order.restaurantId?.name || "Restaurant"}</h3>
                <p>${formattedDate} at ${formattedTime}</p>
              </div>
            </div>
            <span class="order-status ${statusClass}">${order.status || 'Pending'}</span>
          </div>
          <div class="order-details">
            <div class="order-detail-item">
              <div class="label">Order ID</div>
              <div class="value" style="font-size: 12px; color: var(--text-muted);">#${order._id?.slice(-6).toUpperCase()}</div>
            </div>
            <div class="order-detail-item">
              <div class="label">Total Amount</div>
              <div class="value price">₹${order.totalAmount}</div>
            </div>
            <div class="order-detail-item">
              <div class="label">Items</div>
              <div class="value">${order.items?.length || 0} item${order.items?.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="order-detail-item">
              <div class="label">Payment</div>
              <div class="value" style="text-transform: capitalize;">${order.paymentStatus || 'Pending'}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    renderPagination(totalItems, currentPage, ITEMS_PER_PAGE);

  } catch (err) {
    console.error(err);
    document.getElementById("ordersList").innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 16px;">❌</div>
        <h3 style="color: var(--danger);">Failed to load orders</h3>
        <p style="color: var(--text-muted);">${err.message}</p>
      </div>
    `;
  }
};

const goToOrder = (id) => {
  window.location.href = `/orders/${id}`;
};

const goToPage = (page) => {
  const params = new URLSearchParams();
  params.set('page', page);
  window.location.href = `/orders?${params.toString()}`;
};

document.addEventListener("DOMContentLoaded", loadOrders);
