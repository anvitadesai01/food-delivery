const API_BASE = "/api";
const restaurantId = window.location.pathname.split("/").pop();
const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let totalItems = 0;
let allMenuItems = [];

const loadRestaurant = async () => {
    try {
        const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
        const data = await res.json();

        const r = data.data;
        const cuisinePreview = (r.cuisine || []).slice(0, 2).join(" • ") || "Signature menu";

        document.getElementById("restaurantName").innerHTML = `
            <span class="restaurant-title-shell">
                <span class="restaurant-hero-media">
                    <span class="restaurant-hero-glow"></span>
                    <span class="restaurant-hero-copy">
                        <span class="restaurant-media-chip">${r.location || "Premium Kitchen"}</span>
                        <strong>${cuisinePreview}</strong>
                    </span>
                </span>
                <span>${r.name}</span>
            </span>
        `;

        document.getElementById("restaurantInfo").innerHTML = `
            <div class="meta-item">
                <span>⭐</span>
                <strong>${r.rating?.toFixed(1) || '4.0'}</strong>
                <span style="color: rgba(255,255,255,0.6);">(${r.reviews || '100+'} ratings)</span>
            </div>
            <div class="meta-item">
                <span>📍</span>
                <span>${r.location || 'Location'}</span>
            </div>
            <div class="meta-item">
                <span>🍴</span>
                <span>${(r.cuisine || []).join(', ')}</span>
            </div>

        `;
    } catch (err) {
        console.error(err);
        document.getElementById("restaurantName").textContent = "Restaurant not found";
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

    html += `<span class="pagination-info">Page ${current} of ${totalPages} (${total} items)</span>`;

    container.innerHTML = html;
};

const loadMenu = async () => {
    try {
        const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menu`);
        const data = await res.json();

        const menu = data.data;
        const container = document.getElementById("menuList");
        const countEl = document.getElementById("menuCount");

        if (!menu || menu.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">🍽️</div>
                    <h3 style="font-size: 22px; margin-bottom: 12px;">No menu items available</h3>
                    <p style="color: var(--text-muted); margin-top: 8px;">Check back later for updates</p>
                </div>
            `;
            if (countEl) countEl.textContent = "0 items";
            const pagination = document.getElementById("paginationContainer");
            if (pagination) pagination.style.display = "none"; return;
        }

        allMenuItems = menu;
        totalItems = menu.length;

        const params = new URLSearchParams(window.location.search);
        if (params.has('page')) {
            currentPage = parseInt(params.get('page')) || 1;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedMenu = menu.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        if (countEl) countEl.textContent = `${totalItems} items`;

        container.innerHTML = paginatedMenu.map(item => `
            <div class="menu-card">
                <div class="menu-card-art">
                    <span class="menu-card-chip">${item.availability ? "Ready to order" : "Unavailable"}</span>
                    <strong>${item.price ? `₹${item.price}` : "Chef special"}</strong>
                </div>
                <div class="menu-item-header">
                    <div class="menu-item-name">${item.name}</div>
                    <div class="menu-item-price"><span>₹</span>${item.price}</div>
                </div>
                <div class="menu-item-desc">${item.description || 'Delicious food item prepared with fresh ingredients and authentic recipes.'}</div>
                <div class="menu-item-footer">
                    <div class="availability ${item.availability ? '' : 'out-of-stock'}">
                        ${item.availability ? '✅ Available' : '❌ Out of Stock'}
                    </div>
                    <button onclick="addToCart('${item._id}')" class="add-btn" ${item.availability ? '' : 'disabled'}>
                        ${item.availability ? 'Add +' : 'Unavailable'}
                    </button>
                </div>
            </div>
        `).join("");

        renderPagination(totalItems, currentPage, ITEMS_PER_PAGE);
    } catch (err) {
        console.error(err);
    }
};

const goToPage = (page) => {
    const params = new URLSearchParams();
    params.set('page', page);
    window.location.href = `${window.location.pathname}?${params.toString()}`;
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
        updateCartBadge(1);

    } catch (err) {
        console.error(err);
        window.showAppAlert({
            title: "Something went wrong",
            text: "Please try again.",
            icon: "error",
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurant();
    loadMenu();
});
