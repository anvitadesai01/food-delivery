// ===============================
// CONFIG
// ===============================
const API_BASE = "/api";

// ===============================
// FETCH HELPER
// ===============================
const fetchData = async (url) => {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (err) {
    console.error("Fetch Error:", err.message);
    return null;
  }
};

// ===============================
// LOAD TOP RESTAURANTS
// ===============================
const loadRestaurants = async () => {
  const container = document.getElementById("restaurants");
  if (!container) return;

  const restaurants = await fetchData("/api/restaurants/top");

  if (!restaurants || restaurants.length === 0) {
    container.innerHTML = `<p>No restaurants available</p>`;
    return;
  }

  container.innerHTML = restaurants.map(r => `
    <div class="restaurant-card">

      <div class="restaurant-content">
        <div class="restaurant-name">${r.name}</div>

        <div class="restaurant-meta">
          ${r.location}
        </div>

        <div class="restaurant-meta">
          ${(r.cuisine || []).join(", ")}
        </div>

        <div class="rating">
          ⭐ ${r.rating?.toFixed(1) || "New"}
        </div>
      </div>
    </div>
  `).join("");
};

// ===============================
// LOAD HIGHLIGHTS (TOP 5)
// ===============================
const loadHighlights = async () => {
  const container = document.getElementById("highlights");
  if (!container) return;

  const restaurants = await fetchData(`${API_BASE}/restaurants/top`);

  if (!restaurants) return;

  container.innerHTML = restaurants
    .slice(0, 5)
    .map(
      (r, i) => `
      <div class="highlight-item">
        <span class="highlight-rank">#${i + 1}</span>
        <div>
          <strong>${r.name}</strong>
          <small>${r.location}</small>
        </div>
        <span>⭐ ${r.rating || "New"}</span>
      </div>
    `
    )
    .join("");
};


// ===============================
// LOAD DISHES (SAFE)
// ===============================
const loadDishes = async () => {
  const container = document.getElementById("dishes");
  if (!container) return;

  const data = await fetchData(`${API_BASE}/menu`);

  if (!data || data.length === 0) {
    container.innerHTML = `<p>No dishes available</p>`;
    return;
  }

  container.innerHTML = data
    .slice(0, 8)
    .map(
      (dish) => `
      <div class="dish-card">
        <h3>${dish.name}</h3>
        <p>₹${dish.price}</p>
        <small>${dish.availability ? "Available" : "Out of stock"}</small>
      </div>
    `
    )
    .join("");
};

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadRestaurants();
  loadHighlights();
  loadDishes();
});