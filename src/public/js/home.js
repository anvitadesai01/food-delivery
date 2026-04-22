const API_BASE = "/api";

const fetchData = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (err) {
    console.error("Fetch Error:", err.message);
    return null;
  }
};

async function loadCuisines() {
  const container = document.querySelector(".quick-filters");
  if (!container) return;

  // Reuse the restaurants data you already have — no extra API needed
  const restaurants = await fetchData("/api/restaurants/top");
  if (!restaurants || restaurants.length === 0) return;

  // Extract unique cuisines from all restaurants
  const allCuisines = restaurants.flatMap(r => Array.isArray(r.cuisine) ? r.cuisine : []);
  const uniqueCuisines = [...new Set(allCuisines)].filter(Boolean).sort();

  const params = new URLSearchParams(window.location.search);
  const activeCuisine = params.get("cuisine") || "";

  container.innerHTML = `
    <div class="filter-pill ${activeCuisine === "" ? "active" : ""}" data-cuisine="" onclick="filterCuisine('')">
      All
    </div>
    ${uniqueCuisines.map(c => `
      <div class="filter-pill ${activeCuisine === c ? "active" : ""}" data-cuisine="${c}" onclick="filterCuisine('${c}')">
        ${c}
      </div>
    `).join("")}
  `;
}
async function loadRestaurants() {
  const container = document.getElementById("restaurants");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const cuisine = params.get("cuisine");
  const search = params.get("search");

  let url = "/api/restaurants/top";
  if (cuisine) {
    url = `/api/restaurants?cuisine=${encodeURIComponent(cuisine)}`;
  } else if (search) {
    url = `/api/restaurants?search=${encodeURIComponent(search)}`;
  }

  container.innerHTML = Array(4).fill(`
    <div class="restaurant-card">
      <div class="restaurant-image" style="background:#eee;"></div>
      <div class="restaurant-content">
        <div style="height:16px;width:60%;background:#eee;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:12px;width:40%;background:#eee;border-radius:4px;"></div>
      </div>
    </div>
  `).join("");

  const restaurants = await fetchData(url);

  if (!restaurants || restaurants.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
        <div style="font-size:80px;margin-bottom:20px;">🍽️</div>
        <h3 style="font-size:22px;margin-bottom:12px;">No restaurants found</h3>
        <p style="color:var(--text-muted);margin-bottom:20px;">Try a different search or explore all restaurants</p>
        <a href="/restaurants" class="btn-primary" style="margin-top:16px;display:inline-flex;">View All Restaurants →</a>
      </div>
    `;
    return;
  }

  const list = (Array.isArray(restaurants) ? restaurants : restaurants.data || []).slice(0, 8);

  container.innerHTML = list.map(r => {
    const cuisineList = Array.isArray(r.cuisine) ? r.cuisine : [];
    const rating = r.rating?.toFixed(1) || "4.0";
    const primaryCuisine = cuisineList[0] || "Multi Cuisine";
    return `
      <div class="restaurant-card" onclick="goToRestaurant('${r._id}')">
        <div class="restaurant-image restaurant-image-rich">
          <div class="restaurant-image-glow"></div>
          <div class="restaurant-image-pattern"></div>
          <div class="restaurant-media-copy">
            <span class="restaurant-media-chip">${primaryCuisine}</span>
            <strong>${r.location || "Fast service"}</strong>
            <small>${cuisineList.slice(0, 2).join(" • ") || "Chef specials"}</small>
          </div>
          ${r.offer ? `<div class="restaurant-offers"><span class="offer-badge">🎉 ${r.offer}</span></div>` : `<div class="restaurant-offers"><span class="offer-badge">Top Rated</span></div>`}
        </div>
        <div class="restaurant-content">
          <div class="restaurant-header">
            <div class="restaurant-name">${r.name}</div>
            <div class="restaurant-rating">⭐ ${rating}</div>
          </div>
          <div class="restaurant-meta"><span>📍 ${r.location || "Location"}</span></div>
          <div class="restaurant-cuisine">
            ${cuisineList.slice(0, 3).map(c => `<span class="cuisine-tag">${c}</span>`).join("")}
          </div>
          <div class="restaurant-info-row">
            <div class="info-item"><span class="info-bullet"></span> Trending now</div>
            <div class="info-item"><span class="info-bullet"></span> Quick delivery</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function goToRestaurant(id) {
  window.location.href = `/restaurants/${id}`;
}

async function loadDishes() {
  const container = document.getElementById("dishes");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/menu?limit=8&page=1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const response = await res.json();
    const dishes = response.success ? (response.data?.data || []) : [];

    if (!dishes.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:12px;">🍜</div>
          <p>No dishes available</p>
          <a href="/menu" class="btn-outline" style="margin-top:12px;display:inline-flex;">Browse Menu →</a>
        </div>
      `;
      return;
    }

    container.innerHTML = dishes.slice(0, 8).map(dish => {
      const restaurantName = dish.restaurantId?.name || "Restaurant";
      const restaurantLocation = dish.restaurantId?.location || "Fresh kitchen";
      return `
        <div class="restaurant-card" onclick="goToRestaurant('${dish.restaurantId?._id}')">
          <div class="restaurant-image restaurant-image-rich restaurant-image-dish">
            <div class="restaurant-image-glow"></div>
            <div class="restaurant-image-pattern"></div>
            <div class="restaurant-media-copy">
              <span class="restaurant-media-chip">Popular Dish</span>
              <strong>${restaurantName}</strong>
              <small>${restaurantLocation}</small>
            </div>   
          </div>
          <div class="restaurant-content">
            <div class="restaurant-header">
              <div class="restaurant-name" style="font-size:16px;">${dish.name}</div>
              <div class="restaurant-rating price-pill">₹${dish.price}</div>
            </div>
            <div class="restaurant-meta"><span>🍴 ${restaurantName}</span></div>
            <div class="restaurant-info-row">
              <div class="info-item"><span class="info-bullet"></span> Order now</div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading dishes:", err);
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">🍜</div>
        <p>Failed to load dishes</p>
      </div>
    `;
  }
}

function searchFromHome() {
  const query = document.getElementById("heroSearchInput")?.value || "";
  window.location.href = `/restaurants?search=${encodeURIComponent(query)}`;
}

function filterCuisine(cuisine) {
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  const activePill = document.querySelector(`.filter-pill[data-cuisine="${cuisine}"]`);
  if (activePill) activePill.classList.add("active");

  const newUrl = cuisine ? `/?cuisine=${encodeURIComponent(cuisine)}` : "/";
  window.history.pushState({}, "", newUrl);
  loadRestaurants();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadCuisines();
  loadRestaurants();
  loadDishes();

  document.getElementById("heroSearchInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchFromHome();
  });
});
