const menuToken = localStorage.getItem("token");
let restaurantOptions = [];
let menuItemsCache = [];
const menuState = {
  page: 1,
  limit: 10,
};

const menuMessage = document.getElementById("menuMessage");

const setMenuMessage = (message, isError = false) => {
  menuMessage.textContent = message;
  menuMessage.className = `admin-inline-message ${isError ? "error" : "success"}`;
};

const validateMenuPayload = (payload) => {
  if (!payload.restaurantId) return "Restaurant is required";
  if (!payload.name) return "Item name is required";
  if (payload.name.length < 2) return "Item name must be at least 2 characters";
  if (payload.name.length > 100) return "Item name cannot exceed 100 characters";
  if (Number.isNaN(payload.price) || payload.price < 1) return "Price must be at least 1";
  if (Number.isNaN(payload.stock) || payload.stock < 0) return "Stock cannot be negative";
  if (typeof payload.availability !== "boolean") return "Availability must be true or false";
  return "";
};

const renderPagination = (containerId, pagination, onPageChangeName) => {
  const container = document.getElementById(containerId);
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  if (totalPages <= 1) {
    container.innerHTML = totalItems ? `<span class="pagination-summary">${totalItems} records</span>` : "";
    return;
  }

  const pages = [];
  const pushPage = (page) => {
    pages.push(
      `<button class="pagination-btn ${page === currentPage ? "active" : ""}" onclick="${onPageChangeName}(${page})">${page}</button>`
    );
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

const resetMenuForm = () => {
  document.getElementById("menuForm").reset();
  document.getElementById("menuItemId").value = "";
  if (restaurantOptions.length) {
    document.getElementById("menuRestaurant").value = restaurantOptions[0]._id;
  }
  setMenuMessage("");
};

const renderRestaurantOptions = () => {
  const select = document.getElementById("menuRestaurant");
  select.innerHTML = restaurantOptions
    .map((restaurant) => `<option value="${restaurant._id}">${restaurant.name}</option>`)
    .join("");
};

const loadRestaurantsForMenu = async () => {
  const response = await fetch("/api/restaurants?limit=100&page=1");
  const result = await response.json();
  restaurantOptions = result?.data?.data || [];
  renderRestaurantOptions();
};

const renderMenuSummary = (summary = {}) => {
  document.getElementById("menuSummary").innerHTML = [
    { label: "Total Items", value: summary.totalItems || 0 },
    { label: "Available", value: summary.activeItems || 0 },
    { label: "Low Stock", value: summary.lowStockItems || 0 },
  ]
    .map(
      (card) => `
        <article class="admin-stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>Catalog operations signal</small>
        </article>
      `
    )
    .join("");
};

const loadMenu = async () => {
  try {
    const response = await fetch(`/api/menu/admin/all?limit=${menuState.limit}&page=${menuState.page}`, {
      headers: {
        Authorization: `Bearer ${menuToken}`,
      },
    });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to load menu items");
    }

    const items = result?.data?.data || [];
    menuItemsCache = items;
    renderMenuSummary(result?.data?.summary || {});
    document.getElementById("menuList").innerHTML = items.length
      ? `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Restaurant</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.restaurantId?.name || "-"}</td>
                    <td>₹${item.price}</td>
                    <td>${item.stock}</td>
                    <td><span class="status-badge status-${item.availability ? "success" : "cancelled"}">${item.availability ? "available" : "unavailable"}</span></td>
                    <td class="table-actions">
                      <button class="btn-outline btn-small" onclick="editMenuItem('${item._id}')">Edit</button>
                      <button class="btn-outline btn-small btn-danger-lite" onclick="deleteMenuItem('${item._id}')">Delete</button>
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<p class="admin-empty">No menu items found.</p>`;

    renderPagination("menuPagination", result?.data?.pagination || {}, "changeMenuPage");
  } catch (error) {
    document.getElementById("menuList").innerHTML = `<p class="admin-empty">${error.message}</p>`;
  }
};

window.changeMenuPage = (page) => {
  menuState.page = page;
  loadMenu();
};

window.editMenuItem = (id) => {
  const item = menuItemsCache.find((menuItem) => menuItem._id === id);
  if (!item) return;

  document.getElementById("menuItemId").value = item._id;
  document.getElementById("menuRestaurant").value = item.restaurantId?._id || item.restaurantId;
  document.getElementById("menuName").value = item.name || "";
  document.getElementById("menuPrice").value = item.price || "";
  document.getElementById("menuStock").value = item.stock || 0;
  document.getElementById("menuAvailability").value = String(item.availability);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteMenuItem = async (id) => {
  const confirmed = await window.confirmAppAction({
    title: "Delete menu item?",
    text: "This will permanently remove the item from the menu.",
    confirmButtonText: "Delete",
  });
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/menu/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${menuToken}`,
      },
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to delete item");
    }

    setMenuMessage("Menu item deleted successfully.");
    window.showAppToast({ title: "Menu item deleted", icon: "success" });
    loadMenu();
  } catch (error) {
    setMenuMessage(error.message, true);
    window.showAppAlert({
      title: "Delete failed",
      text: error.message,
      icon: "error",
    });
  }
};

document.getElementById("menuForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = document.getElementById("menuItemId").value;
  const stock = Number(document.getElementById("menuStock").value || 0);
  const payload = {
    restaurantId: document.getElementById("menuRestaurant").value,
    name: document.getElementById("menuName").value.trim(),
    price: Number(document.getElementById("menuPrice").value),
    stock,
    availability: document.getElementById("menuAvailability").value === "true" && stock > 0,
  };

  const validationError = validateMenuPayload(payload);
  if (validationError) {
    setMenuMessage(validationError, true);
    window.showAppAlert({
      title: "Validation error",
      text: validationError,
      icon: "warning",
    });
    return;
  }

  try {
    const response = await fetch(id ? `/api/menu/${id}` : "/api/menu", {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${menuToken}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to save menu item");
    }

    setMenuMessage(`Menu item ${id ? "updated" : "created"} successfully.`);
    window.showAppToast({
      title: `Menu item ${id ? "updated" : "created"}`,
      icon: "success",
    });
    resetMenuForm();
    loadMenu();
  } catch (error) {
    setMenuMessage(error.message, true);
    window.showAppAlert({
      title: "Save failed",
      text: error.message,
      icon: "error",
    });
  }
});

document.getElementById("menuReset")?.addEventListener("click", resetMenuForm);
document.getElementById("menuPageSize")?.addEventListener("change", (event) => {
  menuState.limit = Number(event.target.value);
  menuState.page = 1;
  loadMenu();
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadRestaurantsForMenu();
  resetMenuForm();
  loadMenu();
});
