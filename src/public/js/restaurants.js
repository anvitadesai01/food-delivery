const API_BASE = "/api";

// FETCH FUNCTION
const fetchRestaurants = async (query = "") => {
  try {
    const res = await fetch(`${API_BASE}/restaurants${query}`);
    const data = await res.json();

    return data.data?.data || []; // because of your ApiResponse structure
  } catch (err) {
    console.error(err);
    return [];
  }
};

// RENDER UI
const renderRestaurants = (restaurants) => {
  const container = document.getElementById("restaurantList");

  if (!restaurants.length) {
    container.innerHTML = "<p>No restaurants found</p>";
    return;
  }

  container.innerHTML = restaurants
    .map(
      (r) => `
      <div class="card" onclick="goToRestaurant('${r._id}')">
        <div class="card-body">
          <h3>${r.name}</h3>
          <p>${r.location}</p>
          <p>${r.cuisine.join(", ")}</p>
          <span>⭐ ${r.rating}</span>
        </div>
      </div>
    `
    )
    .join("");
};

// INITIAL LOAD
const loadRestaurants = async () => {
  const data = await fetchRestaurants();
  renderRestaurants(data);
};

const goToRestaurant = (id) => {
  window.location.href = `/restaurants/${id}`;
};

// SEARCH
const searchRestaurants = async () => {
  const value = document.getElementById("searchInput").value;
  const data = await fetchRestaurants(`?search=${value}`);
  renderRestaurants(data);
};

// FILTER
const applyFilters = async () => {
  const location = document.getElementById("locationFilter").value;
  const cuisine = document.getElementById("cuisineFilter").value;

  let query = "?";

  if (location) query += `location=${location}&`;
  if (cuisine) query += `cuisine=${cuisine}`;

  const data = await fetchRestaurants(query);
  renderRestaurants(data);
};

document.addEventListener("DOMContentLoaded", loadRestaurants);