const restaurantApi = "/api/restaurants";
const restaurantToken = localStorage.getItem("token");
const restaurantState = {
  page: 1,
  limit: 10,
};

const restaurantCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value);

const restaurantMessage = document.getElementById("restaurantMessage");

const setRestaurantMessage = (message, isError = false) => {
  if (!restaurantMessage) return;
  restaurantMessage.textContent = message;
  restaurantMessage.className = `admin-inline-message ${isError ? "error" : "success"}`;
};

const validateRestaurantPayload = (payload) => {
  if (!payload.name) return "Restaurant name is required";
  if (payload.name.length < 2) return "Restaurant name should have at least 2 characters";
  if (payload.name.length > 100) return "Restaurant name cannot exceed 100 characters";

  if (!payload.location) return "Location is required";
  if (payload.location.length < 2) return "Location should have at least 2 characters";
  if (payload.location.length > 100) return "Location cannot exceed 100 characters";

  if (!Array.isArray(payload.cuisine) || payload.cuisine.length < 1) {
    return "At least one cuisine is required";
  }

  if (payload.cuisine.some((item) => item.length < 2)) {
    return "Each cuisine must have at least 2 characters";
  }

  if (Number.isNaN(payload.rating) || payload.rating < 0 || payload.rating > 5) {
    return "Rating must be between 0 and 5";
  }

  return "";
};

const resetRestaurantForm = () => {
  document.getElementById("restaurantForm").reset();
  document.getElementById("restaurantId").value = "";
  setRestaurantMessage("");
};

const renderPagination = (containerId, pagination, onPageChangeName) => {
  const container = document.getElementById(containerId);
  const currentPage = pagination?.currentPage || pagination?.page || 1;
  const totalPages = pagination?.totalPages || Math.ceil((pagination?.totalItems || pagination?.total || 0) / (pagination?.itemsPerPage || pagination?.limit || restaurantState.limit)) || 1;
  const totalItems = pagination?.totalItems || pagination?.total || 0;

  if (totalPages <= 1) {
    container.innerHTML = totalItems ? `<span class="pagination-summary">${totalItems} records</span>` : "";
    return;
  }

  const pages = [];
  const pushPage = (page) => {
    pages.push(`
      <button class="pagination-btn ${page === currentPage ? "active" : ""}" onclick="${onPageChangeName}(${page})">
        ${page}
      </button>
    `);
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
      <button class="pagination-btn" ${currentPage === 1 ? "disabled" : ""} onclick="${onPageChangeName}(${currentPage - 1})">Prev</button>
      ${pages.join("")}
      <button class="pagination-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="${onPageChangeName}(${currentPage + 1})">Next</button>
    </div>
  `;
};

const fillRestaurantForm = (restaurant) => {
  document.getElementById("restaurantId").value = restaurant._id;
  document.getElementById("restaurantName").value = restaurant.name || "";
  document.getElementById("restaurantLocation").value = restaurant.location || "";
  document.getElementById("restaurantCuisine").value = (restaurant.cuisine || []).join(", ");
  document.getElementById("restaurantRating").value = restaurant.rating ?? "";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const loadRestaurants = async () => {
  try {
    const response = await fetch(`${restaurantApi}?limit=${restaurantState.limit}&page=${restaurantState.page}`);
    const result = await response.json();
    const payload = result?.data || {};
    const restaurants = payload?.data || [];

    document.getElementById("restaurantSummary").innerHTML = [
      { label: "Partners", value: payload.total || restaurants.length },
      {
        label: "Avg Rating",
        value: restaurantCurrency(
          restaurants.length
            ? restaurants.reduce((sum, item) => sum + (item.rating || 0), 0) / restaurants.length
            : 0
        ),
      },
      { label: "Cities", value: new Set(restaurants.map((item) => item.location)).size },
    ]
      .map(
        (card) => `
          <article class="admin-stat-card">
            <span>${card.label}</span>
            <strong>${card.value}</strong>
            <small>Restaurant portfolio signal</small>
          </article>
        `
      )
      .join("");

    document.getElementById("restaurantList").innerHTML = restaurants.length
      ? `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Cuisines</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${restaurants
              .map(
                (restaurant) => `
                  <tr>
                    <td>${restaurant.name}</td>
                    <td>${restaurant.location}</td>
                    <td>${(restaurant.cuisine || []).join(", ")}</td>
                    <td>${restaurant.rating ?? 0}</td>
                    <td class="table-actions">
                      <button class="btn-outline btn-small" onclick="editRestaurant('${restaurant._id}')">Edit</button>
                      <button class="btn-outline btn-small btn-danger-lite" onclick="deleteRestaurant('${restaurant._id}')">Delete</button>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<p class="admin-empty">No restaurants found.</p>`;

    renderPagination(
      "restaurantPagination",
      {
        currentPage: payload.page,
        totalItems: payload.total,
        itemsPerPage: payload.limit,
      },
      "changeRestaurantPage"
    );

    window.restaurantCache = restaurants;
  } catch (error) {
    document.getElementById("restaurantList").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

window.changeRestaurantPage = (page) => {
  restaurantState.page = page;
  loadRestaurants();
};

window.editRestaurant = (id) => {
  const restaurant = (window.restaurantCache || []).find((item) => item._id === id);
  if (restaurant) fillRestaurantForm(restaurant);
};

window.deleteRestaurant = async (id) => {
  const confirmed = await window.confirmAppAction({
    title: "Delete restaurant?",
    text: "This will remove the restaurant and its menu items.",
    confirmButtonText: "Delete",
  });
  if (!confirmed) return;

  try {
    const response = await fetch(`${restaurantApi}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${restaurantToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete restaurant");
    }

    setRestaurantMessage("Restaurant deleted successfully.");
    window.showAppToast({ title: "Restaurant deleted", icon: "success" });
    loadRestaurants();
  } catch (error) {
    setRestaurantMessage(error.message, true);
    window.showAppAlert({
      title: "Delete failed",
      text: error.message,
      icon: "error",
    });
  }
};

document.getElementById("restaurantForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("restaurantId").value;
  const payload = {
    name: document.getElementById("restaurantName").value.trim(),
    location: document.getElementById("restaurantLocation").value.trim(),
    cuisine: document
      .getElementById("restaurantCuisine")
      .value.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    rating: Number(document.getElementById("restaurantRating").value || 0),
  };

  const validationError = validateRestaurantPayload(payload);
  if (validationError) {
    setRestaurantMessage(validationError, true);
    window.showAppAlert({
      title: "Validation error",
      text: validationError,
      icon: "warning",
    });
    return;
  }

  try {
    const response = await fetch(id ? `${restaurantApi}/${id}` : restaurantApi, {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${restaurantToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to save restaurant");
    }

    setRestaurantMessage(`Restaurant ${id ? "updated" : "created"} successfully.`);
    window.showAppToast({
      title: `Restaurant ${id ? "updated" : "created"}`,
      icon: "success",
    });
    resetRestaurantForm();
    loadRestaurants();
  } catch (error) {
    setRestaurantMessage(error.message, true);
    window.showAppAlert({
      title: "Save failed",
      text: error.message,
      icon: "error",
    });
  }
});

document.getElementById("restaurantReset")?.addEventListener("click", resetRestaurantForm);
document.getElementById("restaurantPageSize")?.addEventListener("change", (event) => {
  restaurantState.limit = Number(event.target.value);
  restaurantState.page = 1;
  loadRestaurants();
});

document.addEventListener("DOMContentLoaded", loadRestaurants);
