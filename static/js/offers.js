/* ======================================
   FoodHub Offers JavaScript
   Renders one offer card per restaurant,
   pulled live from MongoDB via /api/restaurants
====================================== */

/* A small rotation of offer themes so every
   restaurant card looks a little different. */

const OFFER_THEMES = [
    {
        tag: "50% OFF",
        title: "Half Price Feast",
        text: "Get 50% off your first order from this restaurant.",
        icon: "fa-solid fa-fire",
        color: "orange"
    },
    {
        tag: "BUY 1 GET 1",
        title: "Double Delight",
        text: "Buy one main course and get a second one free.",
        icon: "fa-solid fa-gift",
        color: "pink"
    },
    {
        tag: "FLAT ₹100 OFF",
        title: "Weekend Special",
        text: "Flat ₹100 off on orders above ₹399.",
        icon: "fa-solid fa-tags",
        color: "green"
    },
    {
        tag: "FREE DELIVERY",
        title: "Zero Delivery Fee",
        text: "Enjoy free delivery on every order, all day today.",
        icon: "fa-solid fa-motorcycle",
        color: "blue"
    },
    {
        tag: "30% OFF",
        title: "Combo Craze",
        text: "30% off on combo meals, only for a limited time.",
        icon: "fa-solid fa-bowl-food",
        color: "purple"
    }
];


document.addEventListener("DOMContentLoaded", function () {

    loadOffers();

});


/* ======================================
   LOAD RESTAURANTS & BUILD OFFER CARDS
====================================== */

async function loadOffers() {

    const grid = document.getElementById("offersGrid");

    try {

        const response = await fetch("/api/restaurants");

        if (!response.ok) {
            throw new Error("Restaurants API failed");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.restaurants)) {
            throw new Error("Could not load restaurants");
        }

        renderOffers(data.restaurants);

    } catch (error) {

        console.error("Error loading offers:", error);

        grid.innerHTML = `
            <div class="offers-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Could not load offers</h3>
                <p>Please make sure the FoodHub server is running.</p>
                <button type="button" onclick="loadOffers()">
                    Retry
                </button>
            </div>
        `;
    }
}


/* ======================================
   RENDER OFFER CARDS
====================================== */

function renderOffers(restaurants) {

    const grid = document.getElementById("offersGrid");

    if (!restaurants.length) {
        grid.innerHTML = `
            <div class="offers-empty">
                <i class="fa-solid fa-shop-slash"></i>
                <h3>No restaurants available right now</h3>
            </div>
        `;
        return;
    }

    grid.innerHTML = "";

    restaurants.forEach(function (restaurant, index) {

        const theme = OFFER_THEMES[index % OFFER_THEMES.length];

        const imageUrl = getRestaurantImage(restaurant, index);

        const menuUrl =
            "/menu.html?restaurant_id=" +
            encodeURIComponent(restaurant.id);

        const card = document.createElement("article");

        card.className = "offer-card theme-" + theme.color;

        card.innerHTML = `

            <div class="offer-card-image">
                <img src="${imageUrl}"
                     alt="${escapeHtml(restaurant.name)}"
                     onerror="this.src='/static/images/logo.png'">

                <span class="offer-tag">
                    <i class="${theme.icon}"></i>
                    ${theme.tag}
                </span>
            </div>

            <div class="offer-card-body">

                <h3 class="offer-restaurant-name">
                    ${escapeHtml(restaurant.name)}
                </h3>

                <h4 class="offer-title">
                    ${theme.title}
                </h4>

                <p class="offer-text">
                    ${theme.text}
                </p>

                <a href="${menuUrl}" class="offer-btn">
                    Order Now
                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        `;

        grid.appendChild(card);

    });
}


/* ======================================
   RESTAURANT IMAGE
   Restaurant names default to "Restaurant N",
   which maps neatly onto /static/images/restaurantN.jpg
====================================== */

function getRestaurantImage(restaurant, index) {

    const match = String(restaurant.name || "")
        .match(/(\d+)/);

    const number = match
        ? match[1]
        : (index + 1);

    return "/static/images/restaurant" + number + ".jpg";
}


/* ======================================
   HTML ESCAPE
====================================== */

function escapeHtml(value) {

    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
}
