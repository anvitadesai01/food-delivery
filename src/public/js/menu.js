const API_BASE = "/api";
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let totalItems = 0;
let currentFilters = {};

const fetchMenuItems = async (query = "") => {
  try {
    const res = await fetch(`${API_BASE}/menu${query}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const renderPagination = (pagination) => {
  const container = document.getElementById("paginationContainer");
  if (!pagination || pagination.totalPages <= 1) {
    container.style.display = "none";
    return;
  }
  
  container.style.display = "flex";
  
  const { currentPage, totalPages, totalItems } = pagination;
  
  let html = `
    <button class="pagination-btn nav-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      ← Prev
    </button>
  `;
  
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
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
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
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
    <button class="pagination-btn nav-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next →
    </button>
  `;
  
  html += `<span class="pagination-info">Page ${currentPage} of ${totalPages} (${totalItems} dishes)</span>`;
  
  container.innerHTML = html;
};

const renderMenuItems = (menuItems) => {
  const container = document.getElementById("menuList");
  const countEl = document.getElementById("resultCount");

  if (!menuItems || menuItems.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
        <div style="font-size: 100px; margin-bottom: 24px;">🍽️</div>
        <h3 style="font-size: 24px; margin-bottom: 12px;">No dishes found</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Try adjusting your search</p>
        <button onclick="clearFilters()" class="btn-primary">Clear Search</button>
      </div>
    `;
    if (countEl) countEl.textContent = "";
    document.getElementById("paginationContainer").style.display = "none";
    return;
  }

  if (countEl) countEl.textContent = `${totalItems} dish${totalItems !== 1 ? 'es' : ''} available`;

  container.innerHTML = menuItems.map(item => {
    const restaurantName = item.restaurantId?.name || 'Restaurant';
    const restaurantLocation = item.restaurantId?.location || '';
    const cuisineLabel = "";
    
    return `
      <div class="restaurant-card" onclick="goToRestaurant('${item.restaurantId?._id}')">
        <div class="restaurant-image restaurant-image-rich restaurant-image-dish">
          <div class="restaurant-image-glow"></div>
          <div class="restaurant-image-pattern"></div>
          <div class="restaurant-media-copy">
            <span class="restaurant-media-chip">${item.availability ? "Available" : "Out of stock"}</span>
            <strong>${restaurantName}</strong>
            <small>${cuisineLabel}</small>
          </div>
          <div class="restaurant-offers"><span class="offer-badge">${item.availability ? "Chef Pick" : "Unavailable"}</span></div>
        </div>
        <div class="restaurant-content">
          <div class="restaurant-header">
            <div class="restaurant-name">${item.name}</div>
            <div class="restaurant-rating price-pill">₹${item.price}</div>
          </div>
          ${restaurantLocation ? `
            <div class="restaurant-meta">
              <span>📍 ${restaurantLocation}</span>
            </div>
          ` : ''}
          <div style="margin-top: 12px;">
            <button onclick="event.stopPropagation(); addToCart('${item._id}')" class="add-btn" ${item.availability ? '' : 'disabled'}>
              ${item.availability ? 'Add +' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

const goToRestaurant = (id) => {
  if (id) {
    window.location.href = `/restaurants/${id}`;
  }
};

const addToCart = async (menuItemId) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      await window.showAppAlert({
        title: "Login Required",
        text: "Please login to add items to cart.",
        icon: "warning",
      });
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        menuItemId,
        quantity: 1,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      await window.showAppAlert({
        title: "Could not add item",
        text: data.message,
        icon: "error",
      });
      return;
    }

    window.showAppToast({ title: "Added to cart", icon: "success" });
  } catch (err) {
    console.error(err);
    window.showAppAlert({
      title: "Something went wrong",
      text: "Please try again.",
      icon: "error",
    });
  }
};

const loadMenu = async () => {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('search')) {
    document.getElementById('searchInput').value = params.get('search');
    currentFilters.search = params.get('search');
  }
  if (params.has('page')) {
    currentPage = parseInt(params.get('page')) || 1;
  }

  let query = "?";
  const queryParams = [];
  
  if (currentFilters.search) {
    queryParams.push(`search=${encodeURIComponent(currentFilters.search)}`);
  }
  queryParams.push(`page=${currentPage}`);
  queryParams.push(`limit=${ITEMS_PER_PAGE}`);
  
  query += queryParams.join("&");

  const response = await fetchMenuItems(query);
  
  if (!response || !response.success) {
    document.getElementById("menuList").innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 16px;">❌</div>
        <h3 style="font-size: 20px;">Failed to load dishes</h3>
        <p style="color: var(--text-muted); margin-top: 8px;">Please try again later</p>
      </div>
    `;
    return;
  }

  const { data, pagination } = response.data;
  totalItems = pagination.totalItems;
  
  renderMenuItems(data);
  renderPagination(pagination);
};

const goToPage = (page) => {
  const params = new URLSearchParams();
  
  if (currentFilters.search) {
    params.set('search', currentFilters.search);
  }
  params.set('page', page);
  
  window.location.href = `/menu?${params.toString()}`;
};

const searchMenu = () => {
  currentFilters.search = document.getElementById("searchInput").value;
  currentPage = 1;
  
  const params = new URLSearchParams();
  if (currentFilters.search) {
    params.set('search', currentFilters.search);
  }
  params.set('page', 1);
  
  window.location.href = `/menu?${params.toString()}`;
};

const clearFilters = () => {
  window.location.href = "/menu";
};

document.addEventListener("DOMContentLoaded", () => loadMenu());

document.getElementById("searchInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMenu();
});
