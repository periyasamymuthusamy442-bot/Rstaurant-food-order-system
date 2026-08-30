/* ======================================
   FoodHub - Manage Menu (Edit Food)
   Loads the logged-in restaurant's own
   menu items and lets the admin edit or
   delete them via a modal
====================================== */

let allMenuItems = [];


document.addEventListener("DOMContentLoaded", function () {

    loadMenuItems();
    setupModal();

});


/* ======================================
   LOAD MENU ITEMS
====================================== */

async function loadMenuItems() {

    const grid = document.getElementById("menuGrid");

    try {

        const response = await fetch(
            "/api/admin/foods",
            {
                method: "GET",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {

            alert("⚠ Please login as admin first.");
            window.location.href = "/admin_login.html";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Could not load menu.");
        }

        allMenuItems = data.foods || [];

        renderMenuGrid(allMenuItems);

    } catch (error) {

        console.error("Error loading menu items:", error);

        grid.innerHTML = `
            <div class="menu-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Could not load your menu. Please refresh the page.
            </div>
        `;
    }
}


/* ======================================
   RENDER MENU GRID
====================================== */

function renderMenuGrid(items) {

    const grid = document.getElementById("menuGrid");

    if (!items.length) {

        grid.innerHTML = `
            <div class="menu-error">
                <i class="fa-solid fa-bowl-food"></i>
                You haven't added any menu items yet.
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    items.forEach(function (food) {

        const imageUrl =
            food.image_url ||
            food.image ||
            "/static/images/logo.png";

        const available = food.available !== false;

        const card = document.createElement("div");
        card.className = "menu-card";

        card.innerHTML = `

            <div class="menu-image">
                <img src="${imageUrl}"
                     alt="${escapeHtml(food.name)}"
                     onerror="this.src='/static/images/logo.png'">
                <span class="category-badge">${escapeHtml(food.category || "")}</span>
            </div>

            <div class="menu-card-body">

                <h3>${escapeHtml(food.name)}</h3>

                <p>${escapeHtml(food.description || "No description added.")}</p>

                <div class="menu-card-footer">
                    <strong>₹${Number(food.price || 0).toFixed(2)}</strong>
                    <span class="availability-badge ${available ? "available" : "unavailable"}">
                        ${available ? "Available" : "Unavailable"}
                    </span>
                </div>

                <div class="menu-card-actions">

                    <button type="button" class="edit-item-btn" data-id="${food.id}">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>

                    <button type="button" class="delete-item-btn" data-id="${food.id}">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>

                </div>

            </div>
        `;

        grid.appendChild(card);
    });


    // Wire up buttons
    grid.querySelectorAll(".edit-item-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            openEditModal(btn.dataset.id);
        });
    });

    grid.querySelectorAll(".delete-item-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            deleteMenuItem(btn.dataset.id);
        });
    });
}


/* ======================================
   MODAL SETUP
====================================== */

function setupModal() {

    const overlay = document.getElementById("editModalOverlay");
    const closeBtn = document.getElementById("modalCloseBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");
    const form = document.getElementById("editFoodForm");

    function close() {
        overlay.classList.remove("open");
    }

    closeBtn.addEventListener("click", close);
    cancelBtn.addEventListener("click", close);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            close();
        }
    });

    form.addEventListener("submit", saveMenuItem);
}


function openEditModal(foodId) {

    const food = allMenuItems.find(function (item) {
        return String(item.id) === String(foodId);
    });

    if (!food) {
        alert("Item not found.");
        return;
    }

    document.getElementById("editFoodId").value = food.id;
    document.getElementById("editName").value = food.name || "";
    document.getElementById("editCategory").value = food.category || "Pizza";
    document.getElementById("editPrice").value = food.price || 0;
    document.getElementById("editDescription").value = food.description || "";
    document.getElementById("editAvailable").checked = food.available !== false;
    document.getElementById("editImage").value = "";

    document.getElementById("editModalOverlay").classList.add("open");
}


/* ======================================
   SAVE (PUT) MENU ITEM
====================================== */

async function saveMenuItem(event) {

    event.preventDefault();

    const saveBtn = document.getElementById("editSaveBtn");
    const foodId = document.getElementById("editFoodId").value;

    const formData = new FormData();

    formData.append("name", document.getElementById("editName").value.trim());
    formData.append("category", document.getElementById("editCategory").value);
    formData.append("price", document.getElementById("editPrice").value);
    formData.append("description", document.getElementById("editDescription").value.trim());
    formData.append("available", document.getElementById("editAvailable").checked ? "true" : "false");

    const imageFile = document.getElementById("editImage").files[0];

    if (imageFile) {
        formData.append("image", imageFile);
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    try {

        const response = await fetch(
            "/api/admin/foods/" + foodId,
            {
                method: "PUT",
                credentials: "same-origin",
                body: formData
            }
        );

        if (response.status === 401) {
            alert("⚠ Please login as admin first.");
            window.location.href = "/admin_login.html";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not update item.");
            return;
        }

        document.getElementById("editModalOverlay").classList.remove("open");

        loadMenuItems();

    } catch (error) {

        console.error("Error saving item:", error);
        alert("Something went wrong while saving. Please try again.");

    } finally {

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
}


/* ======================================
   DELETE MENU ITEM
====================================== */

async function deleteMenuItem(foodId) {

    const confirmed = confirm(
        "Are you sure you want to delete this menu item? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            "/api/admin/foods/" + foodId,
            {
                method: "DELETE",
                credentials: "same-origin"
            }
        );

        if (response.status === 401) {
            alert("⚠ Please login as admin first.");
            window.location.href = "/admin_login.html";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not delete item.");
            return;
        }

        loadMenuItems();

    } catch (error) {

        console.error("Error deleting item:", error);
        alert("Something went wrong while deleting. Please try again.");
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
