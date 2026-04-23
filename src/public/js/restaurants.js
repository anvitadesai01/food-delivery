const API_BASE = "/api";
const ITEMS_PER_PAGE = 8;
let currentPage = 1;
let totalItems = 0;
let allRestaurants = [];
let currentFilters = {};

const fetchRestaurants = async (query = "") => {
  try {
    const res = await fetch(`${API_BASE}/restaurants${query}`);
    const data = await res.json();  
    return data.data;
  } catch (err) {
    console.error(err);
    return [];
  }
};

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

  html += `<span class="pagination-info">Page ${current} of ${totalPages} (${total} restaurants)</span>`;

  container.innerHTML = html;
};

const renderRestaurants = (restaurants) => {
  const container = document.getElementById("restaurantList");
  const countEl = document.getElementById("resultCount");

  if (!restaurants.length) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px;">
        <div style="font-size: 100px; margin-bottom: 24px;">🔍</div>
        <h3 style="font-size: 24px; margin-bottom: 12px;">No restaurants found</h3>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Try adjusting your search or filters</p>
        <button onclick="clearFilters()" class="btn-primary">Clear Filters</button>
      </div>
    `;
    if (countEl) countEl.textContent = "";
    document.getElementById("paginationContainer").style.display = "none";
    return;
  }

  if (countEl) countEl.textContent = `${totalItems} restaurant${totalItems !== 1 ? 's' : ''} found`;

  container.innerHTML = restaurants.map(r => {
    const cuisineList = Array.isArray(r.cuisine) ? r.cuisine : [];
    const rating = r.rating?.toFixed(1) || "4.0";
    const primaryCuisine = cuisineList[0] || "Multi Cuisine";
    const cuisinePreview = cuisineList.slice(0, 2).join(" • ") || "Chef specials";

    return `
      <div class="restaurant-card" onclick="goToRestaurant('${r._id}')">
        <div class="restaurant-image restaurant-image-rich">
          <div class="restaurant-image-glow"></div>
          <div class="restaurant-image-pattern"></div>
          <div class="restaurant-media-copy">
            <span class="restaurant-media-chip">${primaryCuisine}</span>
            <strong>${r.location || "Fresh delivery"}</strong>
            <small>${cuisinePreview}</small>
          </div>
          ${r.offer ? `<div class="restaurant-offers"><span class="offer-badge">${r.offer}</span></div>` : `<div class="restaurant-offers"><span class="offer-badge">Fast Delivery</span></div>`}
        </div>
        <div class="restaurant-content">
          <div class="restaurant-header">
            <div class="restaurant-name">${r.name}</div>
            <div class="restaurant-rating">⭐ ${rating}</div>
          </div>
          <div class="restaurant-meta">
            <span>📍 ${r.location || 'Location'}</span>
          </div>
          <div class="restaurant-cuisine">
            ${cuisineList.slice(0, 3).map(c => `<span class="cuisine-tag">${c}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join("");
};

const goToRestaurant = (id) => {
  window.location.href = `/restaurants/${id}`;
};

const loadRestaurants = async () => {
  const params = new URLSearchParams(window.location.search);
  currentFilters = {};

  if (params.has('search')) {
    document.getElementById('searchInput').value = params.get('search');
    currentFilters.search = params.get('search');
  }
  if (params.has('cuisine')) {
    document.getElementById('cuisineFilter').value = params.get('cuisine');
    currentFilters.cuisine = params.get('cuisine');
  }
  if (params.has('location')) {
    document.getElementById('locationFilter').value = params.get('location');
    currentFilters.location = params.get('location');
  }
  if (params.has('page')) {
    currentPage = parseInt(params.get('page')) || 1;
  }

  let queryParams = [];

  queryParams.push(`page=${currentPage}`);
  queryParams.push(`limit=${ITEMS_PER_PAGE}`);

  if (currentFilters.search) {
    queryParams.push(`search=${encodeURIComponent(currentFilters.search)}`);
  }
  if (currentFilters.cuisine) {
    queryParams.push(`cuisine=${encodeURIComponent(currentFilters.cuisine)}`);
  }
  if (currentFilters.location) {
    queryParams.push(`location=${encodeURIComponent(currentFilters.location)}`);
  }

  const query = "?" + queryParams.join("&");
  const result = await fetchRestaurants(query);

  // backend already paginated
  allRestaurants = result.data;
  totalItems = result.total;
  currentPage = result.page;

  renderRestaurants(result.data);
  renderPagination(result.total, result.page, result.limit);
};

const goToPage = (page) => {
  const params = new URLSearchParams();

  Object.keys(currentFilters).forEach(key => {
    if (currentFilters[key]) {
      params.set(key, currentFilters[key]);
    }
  });

  params.set('page', page);

  window.location.href = `/restaurants?${params.toString()}`;
};

const searchRestaurants = () => {
  currentFilters.search = document.getElementById("searchInput").value;
  currentPage = 1;

  const params = new URLSearchParams();
  Object.keys(currentFilters).forEach(key => {
    if (currentFilters[key]) {
      params.set(key, currentFilters[key]);
    }
  });

  window.location.href = `/restaurants?${params.toString()}`;
};


const clearFilters = () => {
  window.location.href = "/restaurants";
};

document.addEventListener("DOMContentLoaded", () => loadRestaurants());

document.getElementById("searchInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchRestaurants();
});
