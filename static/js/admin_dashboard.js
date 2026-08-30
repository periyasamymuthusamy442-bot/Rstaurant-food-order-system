// ============================================================
// FOODHUB - ADMIN DASHBOARD JS
// Multi-Restaurant Admin Dashboard
// ============================================================

"use strict";


// ============================================================
// GLOBAL STATE
// ============================================================

let dashboardLoading = false;
let refreshTimer = null;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    initializeDashboard();

});


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

async function initializeDashboard() {

    try {

        await verifyAdminSession();

        setupNavigation();

        setupButtons();

        // Dashboard server-side rendered data already exists.
        // API refresh is optional and will fail safely if endpoint
        // is unavailable.

        await refreshDashboardData();

        startAutoRefresh();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

    }

}


// ============================================================
// VERIFY ADMIN SESSION
// ============================================================

async function verifyAdminSession() {

    try {

        const response = await fetch(
            "/api/admin/session",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {

            redirectToAdminLogin();

            return false;
        }

        const data = await response.json();

        if (!data.logged_in) {

            redirectToAdminLogin();

            return false;
        }

        updateRestaurantOwnerUI(
            data
        );

        return true;

    } catch (error) {

        console.error(
            "Admin session check failed:",
            error
        );

        /*
         * Do not immediately redirect when there is a
         * temporary network/server problem.
         */

        return false;
    }

}


// ============================================================
// UPDATE RESTAURANT OWNER UI
// ============================================================

function updateRestaurantOwnerUI(data) {

    if (!data) {
        return;
    }

    const restaurantName =
        data.restaurant_name ||
        data.username ||
        "Restaurant Owner";

    const restaurantElements =
        document.querySelectorAll(
            ".restaurant-name"
        );

    restaurantElements.forEach(function (element) {

        element.textContent =
            restaurantName;

    });


    const ownerNameElements =
        document.querySelectorAll(
            ".owner strong"
        );

    ownerNameElements.forEach(function (element) {

        element.textContent =
            restaurantName;

    });


    const avatar =
        document.querySelector(
            ".owner-avatar"
        );

    if (avatar) {

        avatar.textContent =
            restaurantName
                .charAt(0)
                .toUpperCase();

    }

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(
            ".nav a"
        );

    navLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                navLinks.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                this.classList.add(
                    "active"
                );

            }
        );

    });

}


// ============================================================
// BUTTON SETUP
// ============================================================

function setupButtons() {

    const logoutButton =
        document.querySelector(
            ".logout-btn"
        );

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logoutAdmin();

            }
        );

    }

}


// ============================================================
// REFRESH DASHBOARD
// ============================================================

async function refreshDashboardData() {

    if (dashboardLoading) {
        return;
    }

    dashboardLoading = true;

    try {

        /*
         * First verify the current admin session.
         * This prevents displaying another restaurant's
         * dashboard if the session has expired.
         */

        const sessionResponse =
            await fetch(
                "/api/admin/session",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!sessionResponse.ok) {
            return;
        }

        const sessionData =
            await sessionResponse.json();

        if (!sessionData.logged_in) {

            stopAutoRefresh();

            redirectToAdminLogin();

            return;
        }


        updateRestaurantOwnerUI(
            sessionData
        );


        /*
         * Load restaurant-specific statistics.
         *
         * If this API does not exist yet, the dashboard
         * continues using the server-rendered values.
         */

        await loadAnalytics();


        /*
         * Load restaurant-specific menu.
         */

        await loadRestaurantMenu();


        /*
         * Load restaurant-specific orders.
         */

        await loadRestaurantOrders();

    } catch (error) {

        console.error(
            "Dashboard refresh error:",
            error
        );

    } finally {

        dashboardLoading = false;

    }

}


// ============================================================
// LOAD ANALYTICS
// ============================================================

async function loadAnalytics() {

    try {

        const response =
            await fetch(
                "/api/admin/dashboard/analytics",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        /*
         * API may not exist in current backend.
         * In that case simply keep server-rendered
         * analytics.
         */

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            return;
        }


        const analytics =
            data.analytics || data;


        updateStat(
            [
                "[data-stat='total_orders']",
                ".total-orders"
            ],
            analytics.total_orders
        );


        updateStat(
            [
                "[data-stat='total_revenue']",
                ".total-revenue"
            ],
            formatCurrency(
                analytics.total_revenue
            )
        );


        updateStat(
            [
                "[data-stat='total_items_sold']",
                ".total-items-sold"
            ],
            analytics.total_items_sold
        );


        updateStat(
            [
                "[data-stat='total_menu_items']",
                ".total-menu-items"
            ],
            analytics.total_menu_items
        );

    } catch (error) {

        console.warn(
            "Analytics API unavailable:",
            error
        );

    }

}


// ============================================================
// UPDATE STAT
// ============================================================

function updateStat(
    selectors,
    value
) {

    for (
        let i = 0;
        i < selectors.length;
        i++
    ) {

        const element =
            document.querySelector(
                selectors[i]
            );

        if (element) {

            element.textContent =
                value ?? 0;

            return;
        }

    }

}


// ============================================================
// LOAD RESTAURANT MENU
// ============================================================

async function loadRestaurantMenu() {

    try {

        const response =
            await fetch(
                "/api/admin/foods",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        /*
         * Current backend may not expose GET
         * /api/admin/foods.
         *
         * Existing server-rendered menu remains untouched.
         */

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        /*
         * Only update the table if the backend
         * explicitly returns restaurant-specific data.
         */

        if (Array.isArray(data.foods)) {

            renderRestaurantMenu(
                data.foods
            );

        }

    } catch (error) {

        console.warn(
            "Restaurant menu refresh unavailable:",
            error
        );

    }

}


// ============================================================
// RENDER RESTAURANT MENU
// ============================================================

function renderRestaurantMenu(foods) {

    const table =
        document.querySelector(
            ".section table"
        );

    if (!table) {
        return;
    }

    const tbody =
        table.querySelector(
            "tbody"
        );

    if (!tbody) {
        return;
    }

    /*
     * Don't destroy server-rendered content when
     * there are no returned foods.
     */

    if (!Array.isArray(foods)) {
        return;
    }

    if (foods.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty">
                        <div class="empty-icon">
                            🍽️
                        </div>
                        <h3>No menu items yet</h3>
                        <p>
                            Start adding food items to
                            your restaurant menu.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = foods.map(
        function (food) {

            const image =
                food.image_url ||
                food.image ||
                "";


            const imageHTML =
                image
                    ? `
                        <img
                            class="food-image"
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(
                                food.name || "Food"
                            )}"
                        >
                      `
                    : `
                        <div
                            class="food-image"
                            style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:22px;
                            "
                        >
                            🍽️
                        </div>
                      `;


            return `
                <tr>

                    <td>

                        <div class="food-info">

                            ${imageHTML}

                            <div>

                                <div class="food-name">

                                    ${escapeHTML(
                                        food.name ||
                                        "Food Item"
                                    )}

                                </div>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="category">

                            ${escapeHTML(
                                food.category ||
                                "General"
                            )}

                        </span>

                    </td>


                    <td>

                        <span class="price">

                            ₹${formatNumber(
                                food.price
                            )}

                        </span>

                    </td>


                    <td>

                        ⭐
                        ${formatNumber(
                            food.rating || 4.5
                        )}

                    </td>

                </tr>
            `;

        }
    ).join("");

}


// ============================================================
// LOAD RESTAURANT ORDERS
// ============================================================

async function loadRestaurantOrders() {

    try {

        const response =
            await fetch(
                "/api/admin/orders",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        if (Array.isArray(data.orders)) {

            /*
             * Backend MUST already filter orders
             * by logged-in restaurant.
             *
             * Never trust frontend filtering for
             * authorization.
             */

            renderRestaurantOrders(
                data.orders
            );

        }

    } catch (error) {

        console.warn(
            "Restaurant order refresh unavailable:",
            error
        );

    }

}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderRestaurantOrders(orders) {

    /*
     * Find the second table.
     * First table = menu.
     * Second table = orders.
     */

    const tables =
        document.querySelectorAll(
            ".section table"
        );

    if (tables.length < 2) {
        return;
    }

    const orderTable =
        tables[1];

    const tbody =
        orderTable.querySelector(
            "tbody"
        );

    if (!tbody) {
        return;
    }


    if (!orders.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">

                    <div class="empty">

                        <div class="empty-icon">
                            📦
                        </div>

                        <h3>
                            No orders yet
                        </h3>

                        <p>
                            Your restaurant orders
                            will appear here.
                        </p>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        orders
            .slice(0, 10)
            .map(
                function (order) {

                    return createOrderRow(
                        order
                    );

                }
            )
            .join("");

}


// ============================================================
// CREATE ORDER ROW
// ============================================================

function createOrderRow(order) {

    const orderId =
        String(
            order.id ||
            order._id ||
            ""
        );

    const shortId =
        orderId.slice(-6);


    const status =
        order.status ||
        "Preparing";


    let statusClass =
        "preparing";

    if (
        status ===
        "Out for Delivery"
    ) {

        statusClass = "out";

    } else if (
        status === "Delivered"
    ) {

        statusClass = "delivered";

    }


    const items =
        Array.isArray(order.items)
            ? order.items
            : [];


    const itemText =
        items
            .map(
                function (item) {

                    return (
                        escapeHTML(
                            item.name ||
                            "Food"
                        )
                        +
                        " ×"
                        +
                        Number(
                            item.quantity || 1
                        )
                    );

                }
            )
            .join(", ");


    const total =
        formatNumber(
            order.grand_total || 0
        );


    const createdAt =
        formatDate(
            order.created_at
        );


    return `
        <tr>

            <td>
                #${escapeHTML(shortId)}
            </td>

            <td>
                ${itemText || "-"}
            </td>

            <td>
                ₹${total}
            </td>

            <td>

                <span
                    class="status ${statusClass}"
                >
                    ${escapeHTML(status)}
                </span>

            </td>

            <td>
                ${escapeHTML(createdAt)}
            </td>

        </tr>
    `;

}


// ============================================================
// LOGOUT ADMIN
// ============================================================

async function logoutAdmin() {

    /*
     * Prevent multiple logout requests.
     */

    const buttons =
        document.querySelectorAll(
            ".logout-btn"
        );

    buttons.forEach(
        function (button) {

            button.disabled = true;

        }
    );


    try {

        const response =
            await fetch(
                "/api/admin/logout",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json()
                .catch(
                    function () {
                        return {};
                    }
                );


        if (
            response.ok &&
            (
                data.success === true ||
                response.status === 200
            )
        ) {

            stopAutoRefresh();

            window.location.href =
                "/admin_login.html";

            return;
        }


        alert(
            data.message ||
            "Logout failed. Please try again."
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to logout. Please try again."
        );

    } finally {

        buttons.forEach(
            function (button) {

                button.disabled = false;

            }
        );

    }

}


// ============================================================
// AUTO REFRESH
// ============================================================

function startAutoRefresh() {

    stopAutoRefresh();


    /*
     * Refresh every 30 seconds.
     *
     * This is only a UI convenience.
     * Security is handled by Flask backend.
     */

    refreshTimer =
        setInterval(
            function () {

                refreshDashboardData();

            },
            30000
        );

}


// ============================================================
// STOP AUTO REFRESH
// ============================================================

function stopAutoRefresh() {

    if (refreshTimer) {

        clearInterval(
            refreshTimer
        );

        refreshTimer = null;

    }

}


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToAdminLogin() {

    const currentPath =
        window.location.pathname;


    if (
        currentPath !==
        "/admin_login.html"
    ) {

        window.location.href =
            "/admin_login.html";

    }

}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toFixed(2);

}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(value) {

    return "₹" +
        formatNumber(value);

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    try {

        const date =
            new Date(value);


        if (Number.isNaN(
            date.getTime()
        )) {

            return String(value);

        }


        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (error) {

        return String(value);

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const text =
        String(
            value ?? ""
        );


    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// PAGE VISIBILITY
// ============================================================

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.hidden
        ) {

            stopAutoRefresh();

        } else {

            startAutoRefresh();

            refreshDashboardData();

        }

    }
);


// ============================================================
// BROWSER PAGE EXIT
// ============================================================

window.addEventListener(
    "beforeunload",
    function () {

        stopAutoRefresh();

    }
);