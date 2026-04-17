const API = "/api/restaurants";
const token = localStorage.getItem("token");

const loadRestaurants = async () => {
  const list = document.getElementById("list");
  list.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;
  try {
    const res = await fetch(API);
    const data = await res.json();
    // data.data is paginated: { data: [...], total, page }
    const restaurants = data?.data?.data || data?.data || [];
    if (!restaurants.length) {
      list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">No restaurants found.</p>`;
      return;
    }
    list.innerHTML = restaurants.map(r => `
      <div class="restaurant-card">
        <div class="restaurant-image">
          <div style="width:100%;height:100%;background:linear-gradient(135deg,#2d2d2d,#1a1a1a);display:flex;align-items:center;justify-content:center;font-size:48px;">🍽️</div>
        </div>
        <div class="restaurant-content">
          <div class="restaurant-header">
            <div class="restaurant-name">${r.name}</div>
          </div>
          <div class="restaurant-meta"><span>📍 ${r.location || "N/A"}</span></div>
          <div class="restaurant-cuisine">
            ${(Array.isArray(r.cuisine) ? r.cuisine : []).slice(0,3).map(c => `<span class="cuisine-tag">${c}</span>`).join("")}
          </div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px;">
            <button class="btn-outline" style="flex:1;padding:8px;" onclick="deleteRestaurant('${r._id}')">🗑 Delete</button>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Failed to load restaurants: ${err.message}</p>`;
  }
};

const deleteRestaurant = async (id) => {
  if (!confirm("Delete this restaurant?")) return;
  try {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Delete failed");
    loadRestaurants();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

const createRestaurant = async () => {
  const name = prompt("Restaurant name?");
  if (!name) return;
  const location = prompt("Location?");
  const cuisine = prompt("Cuisines (comma separated)?");
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, location, cuisine: cuisine ? cuisine.split(",").map(c => c.trim()) : [] })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    loadRestaurants();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

document.addEventListener("DOMContentLoaded", loadRestaurants);