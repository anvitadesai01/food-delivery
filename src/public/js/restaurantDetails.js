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
        const firstLetter = r.name?.charAt(0) || 'R';

        document.getElementById("restaurantName").innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 20px;">
                <span style="font-size: 64px; width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: 800;">
                    ${firstLetter}
                </span>
                ${r.name}
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
            document.getElementById("paginationContainer").style.display = "none";
            return;
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
            alert("Please login to add items to cart");
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
            alert(data.message);
            return;
        }

        showToast("Added to cart! 🛒");
        location.reload();

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
};

const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurant();
    loadMenu();
});
