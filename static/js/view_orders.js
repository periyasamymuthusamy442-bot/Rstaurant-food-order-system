/* ======================================
   FoodHub - View Orders (Admin)
   Loads this restaurant's own orders and
   lets the admin update each order's status
====================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadOrders();

    const refreshBtn = document.getElementById("refreshOrdersBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadOrders);
    }

});


/* ======================================
   LOAD ORDERS
====================================== */

async function loadOrders() {

    const tbody = document.getElementById("ordersTableBody");

    try {

        const response = await fetch("/api/admin/orders", {
            method: "GET",
            credentials: "same-origin"
        });

        if (response.status === 401) {

            alert("⚠ Please login as admin first.");
            window.location.href = "/admin_login.html";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Could not load orders.");
        }

        renderOrders(data.orders || []);

    } catch (error) {

        console.error("Error loading orders:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h3>Could not load orders</h3>
                    <p>Please refresh the page and try again.</p>
                </td>
            </tr>
        `;
    }
}


/* ======================================
   RENDER ORDERS TABLE
====================================== */

function renderOrders(orders) {

    const tbody = document.getElementById("ordersTableBody");

    if (!orders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-icon">🧾</div>
                    <h3>No orders yet</h3>
                    <p>New orders placed by customers will show up here.</p>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    orders.forEach(function (order) {

        const itemsList = (order.items || [])
            .map(function (item) {
                return `<span class="item-name">${item.quantity} × ${escapeHtml(item.name)}</span>`;
            })
            .join("");

        const shortId = String(order.id || "").slice(-8);

        const dateLabel = order.created_at
            ? new Date(order.created_at).toLocaleString()
            : "-";

        const row = document.createElement("tr");

        row.innerHTML = `

            <td><strong class="order-id">#${shortId}</strong></td>

            <td>
                <div class="customer-cell">
                    <strong>${escapeHtml(order.customer_name || "-")}</strong>
                    ${order.customer_phone ? `<small>${escapeHtml(order.customer_phone)}</small>` : ""}
                </div>
            </td>

            <td class="address-cell">
                ${escapeHtml(order.customer_address || "-")}
            </td>

            <td><div class="order-items">${itemsList || "-"}</div></td>

            <td class="amount">₹${Number(order.grand_total || 0).toFixed(2)}</td>

            <td class="payment-method">${escapeHtml(order.payment_method || "-")}</td>

            <td>
                <div class="status-cell">

                    <span class="status-badge ${getStatusClass(order.status)}">
                        ${escapeHtml(order.status || "Preparing")}
                    </span>

                    ${
                        order.status !== "Delivered"
                            ? `<button type="button" class="advance-status-btn" data-id="${order.id}">
                                   Mark Next <i class="fa-solid fa-arrow-right"></i>
                               </button>`
                            : ""
                    }

                </div>
            </td>

            <td>${dateLabel}</td>
        `;

        tbody.appendChild(row);
    });


    // Wire up "Mark Next" buttons
    tbody.querySelectorAll(".advance-status-btn").forEach(function (btn) {

        btn.addEventListener("click", function () {
            advanceOrderStatus(btn.dataset.id, btn);
        });
    });
}


/* ======================================
   STATUS CLASS HELPER
====================================== */

function getStatusClass(status) {

    if (!status) {
        return "preparing";
    }

    return status
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace("out-for-delivery", "out-delivery");
}


/* ======================================
   ADVANCE ORDER STATUS
   The backend moves the order one step
   forward in Preparing -> Out for Delivery
   -> Delivered (it does not accept an
   arbitrary target status).
====================================== */

async function advanceOrderStatus(orderId, buttonEl) {

    buttonEl.disabled = true;

    try {

        const response = await fetch(
            `/api/admin/orders/${orderId}/status`,
            {
                method: "PUT",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" }
            }
        );

        if (response.status === 401) {
            alert("⚠ Please login as admin first.");
            window.location.href = "/admin_login.html";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not update order status.");
            return;
        }

        // Re-render from the server's source of truth
        loadOrders();

    } catch (error) {

        console.error("Error updating order status:", error);
        alert("Something went wrong. Please try again.");
        buttonEl.disabled = false;
    }
}


/* ======================================
   HTML ESCAPE
====================================== */

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
}
