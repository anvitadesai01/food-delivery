const API_BASE = "/api";
const orderId = window.location.pathname.split("/").pop();

const loadOrder = async () => {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (!data.success) {
            await window.showAppAlert({
                title: "Unable to load order",
                text: data.message,
                icon: "error",
            });
            return;
        }

        const order = data.data;
        
        document.getElementById("orderIdDisplay").textContent = `Order #${order._id?.slice(-6).toUpperCase() || orderId.slice(-6).toUpperCase()}`;

        updateProgressBar(order.status);

        document.getElementById("orderInfo").innerHTML = `
            <div class="info-item">
                <div class="label">Restaurant</div>
                <div class="value">${order.restaurantId?.name || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="label">Order Date</div>
                <div class="value">${new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }).format(new Date(order.createdAt))}</div>
            </div>
            <div class="info-item">
                <div class="label">Total Amount</div>
                <div class="value price">₹${order.totalAmount}</div>
            </div>
            <div class="info-item">
                <div class="label">Payment Method</div>
                <div class="value" style="text-transform: capitalize;">${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online'}</div>
            </div>
            <div class="info-item">
                <div class="label">Payment Status</div>
                <div class="value" style="text-transform: capitalize; color: ${order.paymentStatus === 'paid' ? 'var(--success)' : '#f59e0b'};">
                    ${order.paymentStatus || 'Pending'}
                </div>
            </div>
            <div class="info-item">
                <div class="label">Order Status</div>
                <div class="value" id="statusText" style="text-transform: capitalize;">${order.status || 'Pending'}</div>
            </div>
        `;

        const itemsContainer = document.getElementById("orderItems");

        if (!order.items || order.items.length === 0) {
            itemsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    No items found
                </div>
            `;
        } else {
            itemsContainer.innerHTML = order.items.map(item => `
                <div class="order-item">
                    <div class="order-item-info">
                        <span style="font-size: 24px;">🍴</span>
                        <div>
                            <div class="order-item-name">${item.menuItemId?.name || 'Item'}</div>
                            <div class="order-item-qty">Qty: ${item.quantity}</div>
                        </div>
                    </div>
                    <div class="order-item-price">₹${(item.menuItemId?.price || 0) * item.quantity}</div>
                </div>
            `).join("");
        }

    } catch (err) {
        console.error(err);
        document.getElementById("orderIdDisplay").textContent = "Failed to load order";
    }
};

const updateProgressBar = (status) => {
    const steps = document.querySelectorAll('.progress-step');
    const statusOrder = ['confirmed', 'preparing', 'out-for-delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(status?.toLowerCase());

    steps.forEach((step, index) => {
        step.classList.remove('completed', 'active');
        if (index < currentIndex) {
            step.classList.add('completed');
        } else if (index === currentIndex) {
            step.classList.add('active');
        }
    });
};

document.addEventListener("DOMContentLoaded", loadOrder);
