const token = localStorage.getItem("token");

const loadMenu = async () => {
  const container = document.getElementById("menu");
  container.innerHTML = `<div class="loading"><div class="loading-spinner"></div></div>`;
  try {
    const res = await fetch("/api/menu?limit=50&page=1");
    const data = await res.json();
    // response shape: { success, data: { data: [...], total, page } }
    const items = data?.data?.data || data?.data || [];
    if (!items.length) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">No menu items found.</p>`;
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="menu-card">
        <div class="menu-item-header">
          <div class="menu-item-name">${item.name}</div>
          <div class="menu-item-price"><span>₹${item.price}</span></div>
        </div>
        <p class="menu-item-desc">${item.description || "No description"}</p>
        <div class="menu-item-footer">
          <span class="availability ${item.isAvailable === false ? "out-of-stock" : ""}">
            ${item.isAvailable === false ? "● Out of stock" : "● Available"}
          </span>
          <button class="add-btn" style="background:var(--danger);" onclick="deleteItem('${item._id}')">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px;">Failed to load menu: ${err.message}</p>`;
  }
};

const deleteItem = async (id) => {
  if (!confirm("Delete this item?")) return;
  try {
    const res = await fetch(`/api/menu/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Delete failed");
    loadMenu();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

document.addEventListener("DOMContentLoaded", loadMenu);