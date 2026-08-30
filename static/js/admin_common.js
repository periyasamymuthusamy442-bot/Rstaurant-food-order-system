/* ======================================
   FoodHub Admin - Shared Helpers
   Used across all restaurant admin pages
   (dashboard, add food, edit food, orders)
====================================== */

async function logoutAdmin() {

    const confirmed = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            "/api/admin/logout",
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            window.location.href = "/admin_login.html";
        } else {
            alert(data.message || "Logout failed.");
        }

    } catch (error) {

        console.error("Logout error:", error);

        // Even if the request failed, send the admin
        // back to the login page.
        window.location.href = "/admin_login.html";
    }
}


/* ======================================
   MOBILE SIDEBAR TOGGLE
   Shared across every admin page that
   uses the admin_dashboard.css sidebar
====================================== */

function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle("mobile-open");
}

document.addEventListener("click", function (event) {

    const sidebar = document.getElementById("sidebar");
    const menuButton = document.querySelector(".mobile-menu-btn");

    if (!sidebar || !menuButton) {
        return;
    }

    if (
        window.innerWidth <= 900 &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        sidebar.classList.remove("mobile-open");
    }
});
