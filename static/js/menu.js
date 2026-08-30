/* ======================================
   FoodHub Menu JavaScript
====================================== */

let allFoods = [];


/* ======================================
   PAGE LOAD
====================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadFoods();

    setupSearch();

    setupCategoryFilter();

});


/* ======================================
   LOAD FOODS FROM FLASK / MONGODB
====================================== */

async function loadFoods() {

    try {

        /* ----------------------------------
           GET SELECTED RESTAURANT
        ---------------------------------- */

        const params = new URLSearchParams(
            window.location.search
        );

        const selectedRestaurantId =
            params.get("restaurant_id");

        const selectedRestaurantKey =
            params.get("restaurant_key");


        /*
         * Menu must always belong to one restaurant.
         */

        if (!selectedRestaurantId && !selectedRestaurantKey) {

            alert(
                "⚠ Please select a restaurant first."
            );

            window.location.href = "/";

            return;
        }


        let restaurantId =
            selectedRestaurantId;


        /*
         * If restaurant_key is available,
         * convert it to MongoDB restaurant ID.
         */

        if (!restaurantId && selectedRestaurantKey) {

            const restaurantNumber =
                selectedRestaurantKey
                    .replace("restaurant", "")
                    .trim();


            if (!/^[1-8]$/.test(restaurantNumber)) {

                alert(
                    "⚠ Invalid restaurant selection."
                );

                window.location.href = "/";

                return;
            }


            /* ----------------------------------
               GET ALL RESTAURANTS
            ---------------------------------- */

            const restaurantResponse =
                await fetch(
                    "/api/restaurants"
                );


            if (!restaurantResponse.ok) {

                throw new Error(
                    "Restaurant API failed"
                );

            }


            const restaurantData =
                await restaurantResponse.json();


            if (
                !restaurantData.success ||
                !Array.isArray(
                    restaurantData.restaurants
                )
            ) {

                throw new Error(
                    "Could not load restaurants"
                );

            }


            /* ----------------------------------
               FIND SELECTED RESTAURANT
            ---------------------------------- */

            const expectedName =
                "Restaurant " +
                restaurantNumber;


            const selectedRestaurant =
                restaurantData.restaurants.find(
                    function (restaurant) {

                        return (
                            String(
                                restaurant.name || ""
                            )
                                .trim()
                                .toLowerCase()
                            ===
                            expectedName
                                .toLowerCase()
                        );

                    }
                );


            if (
                !selectedRestaurant ||
                !selectedRestaurant.id
            ) {

                alert(
                    "⚠ Selected restaurant was not found."
                );

                window.location.href = "/";

                return;
            }


            restaurantId =
                selectedRestaurant.id;

        }


        /* ----------------------------------
           LOAD ONLY SELECTED RESTAURANT FOODS
        ---------------------------------- */

        const response =
            await fetch(
                "/api/foods?restaurant_id=" +
                encodeURIComponent(
                    restaurantId
                )
            );


        if (!response.ok) {

            throw new Error(
                "Food API failed"
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            console.error(
                "Failed to load foods:",
                data.message
            );

            return;
        }


        /* ----------------------------------
           REMOVE DUPLICATE FOODS
        ---------------------------------- */

        const uniqueFoods = [];

        const seenFoods =
            new Set();


        (data.foods || []).forEach(
            function (food) {

                const foodName =
                    String(
                        food.name || ""
                    )
                        .trim()
                        .toLowerCase();


                const foodCategory =
                    String(
                        food.category || ""
                    )
                        .trim()
                        .toLowerCase();


                const duplicateKey =
                    foodName +
                    "|" +
                    foodCategory;


                if (
                    !seenFoods.has(
                        duplicateKey
                    )
                ) {

                    seenFoods.add(
                        duplicateKey
                    );

                    uniqueFoods.push(
                        food
                    );

                }

            }
        );


        allFoods =
            uniqueFoods;


        displayFoods(
            allFoods
        );


        console.log(
            "Selected Restaurant ID:",
            restaurantId
        );


        console.log(
            "Foods loaded:",
            allFoods
        );


        /*
         * Home page category support
         */

        handleHomeCategory();

    }

    catch (error) {

        console.error(
            "Error connecting to Flask:",
            error
        );


        const foodContainer =
            document.querySelector(
                ".food-container"
            );


        if (foodContainer) {

            foodContainer.innerHTML = `

                <div style="
                    width:100%;
                    text-align:center;
                    padding:50px;
                ">

                    <h2 style="
                        color:red;
                    ">
                        ⚠ Could not connect to Flask server.
                    </h2>

                    <p>
                        Please make sure Flask server is running.
                    </p>

                    <button
                        onclick="loadFoods()"
                        style="
                            padding:12px 25px;
                            border:none;
                            border-radius:8px;
                            background:#ff6600;
                            color:white;
                            cursor:pointer;
                        "
                    >
                        🔄 Retry
                    </button>

                </div>

            `;

        }

    }

}


/* ======================================
   DISPLAY FOOD CARDS
====================================== */

function displayFoods(foods) {

    const foodContainer =
        document.querySelector(
            ".food-container"
        );


    if (!foodContainer) {

        console.error(
            "Food container not found."
        );

        return;
    }


    foodContainer.innerHTML = "";


    /* ----------------------------------
       NO FOOD
    ---------------------------------- */

    if (
        !foods ||
        foods.length === 0
    ) {

        foodContainer.innerHTML = `

            <div style="
                width:100%;
                text-align:center;
                padding:50px;
            ">

                <i
                    class="fa-solid fa-utensils"
                    style="
                        font-size:50px;
                        color:#ff6600;
                    "
                ></i>

                <h2>
                    No Food Items Available
                </h2>

                <p>
                    Please try another category.
                </p>

            </div>

        `;

        return;
    }


    /* ----------------------------------
       CREATE FOOD CARDS
    ---------------------------------- */

    foods.forEach(
        function (food) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "food-card";


            /* Food ID */

            card.setAttribute(
                "data-food-id",
                food.id || ""
            );


            /* Category */

            card.setAttribute(
                "data-category",
                (
                    food.category || ""
                ).toLowerCase()
            );


            /* ----------------------------------
               IMAGE URL
            ---------------------------------- */

            let imageURL =
                food.image_url ||
                food.image ||
                "";


            if (
                imageURL &&
                !imageURL.startsWith("http") &&
                !imageURL.startsWith("/")
            ) {

                imageURL =
                    "/static/" +
                    imageURL;

            }


            /* Always fall back to the logo instead of
               rendering an <img> with an empty src,
               which can show as a broken image icon
               and may not even trigger onerror. */

            if (!imageURL) {

                imageURL =
                    "/static/images/logo.png";

            }


            /* ----------------------------------
               FOOD CARD
            ---------------------------------- */

            card.innerHTML = `

                <img
                    src="${imageURL}"
                    alt="${escapeHTML(
                        food.name
                    )}"
                    onerror="
                        this.src='/static/images/logo.png';
                    "
                >

                <h3>
                    ${escapeHTML(
                        food.name
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        food.description || ""
                    )}
                </p>

                <h4>
                    ⭐ ${Number(
                        food.rating || 4.5
                    ).toFixed(1)}
                </h4>

                <h4>
                    ₹${Number(
                        food.price || 0
                    ).toFixed(0)}
                </h4>

                <button
                    class="add-cart-btn"
                    type="button"
                >

                    <i class="
                        fa-solid
                        fa-cart-plus
                    "></i>

                    Add To Cart

                </button>

            `;


            /* ----------------------------------
               ADD TO CART
            ---------------------------------- */

            const addButton =
                card.querySelector(
                    ".add-cart-btn"
                );


            if (addButton) {

                addButton.addEventListener(
                    "click",
                    function () {

                        addToCart(
                            food
                        );

                    }
                );

            }


            foodContainer.appendChild(
                card
            );

        }
    );

}


/* ======================================
   SEARCH
====================================== */

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            const searchValue =
                searchInput.value
                    .toLowerCase()
                    .trim();


            const filteredFoods =
                allFoods.filter(
                    function (food) {

                        const name =
                            (
                                food.name ||
                                ""
                            ).toLowerCase();


                        const category =
                            (
                                food.category ||
                                ""
                            ).toLowerCase();


                        return (
                            name.includes(
                                searchValue
                            ) ||
                            category.includes(
                                searchValue
                            )
                        );

                    }
                );


            displayFoods(
                filteredFoods
            );

        }
    );

}


/* ======================================
   CATEGORY FILTER
====================================== */

function setupCategoryFilter() {

    const buttons =
        document.querySelectorAll(
            ".category button"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const category =
                        this.innerText
                            .trim()
                            .toLowerCase();


                    /* ----------------------------------
                       ALL
                    ---------------------------------- */

                    if (
                        category === "all"
                    ) {

                        displayFoods(
                            allFoods
                        );

                        return;
                    }


                    /* ----------------------------------
                       FILTER
                    ---------------------------------- */

                    const filteredFoods =
                        allFoods.filter(
                            function (food) {

                                return (
                                    (
                                        food.category ||
                                        ""
                                    )
                                        .toLowerCase()
                                        .trim()
                                    ===
                                    category
                                );

                            }
                        );


                    displayFoods(
                        filteredFoods
                    );

                }
            );

        }
    );

}


/* ======================================
   ADD FOOD TO CART
====================================== */

function addToCart(food) {

    /* ----------------------------------
       LOGIN CHECK
       (uses the real Flask session state
       injected into window.IS_LOGGED_IN,
       not a localStorage flag)
    ---------------------------------- */

    if (!window.IS_LOGGED_IN) {

        alert(
            "⚠ Please Login First"
        );


        window.location.href =
            "/login.html";


        return;
    }


    /* ----------------------------------
       GET EXISTING CART
    ---------------------------------- */

    let cart = [];


    try {

        const savedCart =
            localStorage.getItem(
                "cart"
            );


        if (savedCart) {

            cart =
                JSON.parse(
                    savedCart
                );

        }


        if (
            !Array.isArray(cart)
        ) {

            cart = [];

        }

    }

    catch (error) {

        console.error(
            "Cart read error:",
            error
        );


        cart = [];

    }


    /* ----------------------------------
       FOOD ID
    ---------------------------------- */

    const foodId =
        String(
            food.id || ""
        );


    /* ----------------------------------
       CHECK EXISTING FOOD
    ---------------------------------- */

    const existingItem =
        cart.find(
            function (item) {

                return (
                    String(
                        item.food_id
                    ) === foodId
                );

            }
        );


    /* ----------------------------------
       EXISTING FOOD
    ---------------------------------- */

    if (existingItem) {

        existingItem.quantity =
            Number(
                existingItem.quantity || 1
            ) + 1;

    }


    /* ----------------------------------
       NEW FOOD
    ---------------------------------- */

    else {

        let image =
            food.image_url ||
            food.image ||
            "";


        if (
            image &&
            !image.startsWith("http") &&
            !image.startsWith("/")
        ) {

            image =
                "/static/" +
                image;

        }


        cart.push({

            food_id:
                foodId,

            name:
                food.name || "",

            price:
                Number(
                    food.price || 0
                ),

            quantity:
                1,

            image:
                image,

            category:
                food.category || "",

            rating:
                Number(
                    food.rating || 4.5
                )

        });

    }


    /* ----------------------------------
       SAVE CART
    ---------------------------------- */

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    /* ----------------------------------
       CONSOLE
    ---------------------------------- */

    console.log(
        "✅ Food added to cart"
    );


    console.log(
        "Cart:",
        cart
    );


    console.log(
        "Cart JSON:",
        localStorage.getItem(
            "cart"
        )
    );


    /* ----------------------------------
       SUCCESS
    ---------------------------------- */

    alert(
        food.name +
        " Added To Cart 🛒"
    );

}


/* ======================================
   HOME CATEGORY
====================================== */

function handleHomeCategory() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const category =
        params.get(
            "category"
        );


    if (!category) {

        return;

    }


    const categoryName =
        category
            .toLowerCase()
            .trim();


    const filteredFoods =
        allFoods.filter(
            function (food) {

                return (
                    (
                        food.category ||
                        ""
                    )
                        .toLowerCase()
                        .trim()
                    ===
                    categoryName
                );

            }
        );


    if (
        filteredFoods.length > 0
    ) {

        displayFoods(
            filteredFoods
        );

    }

}


/* ======================================
   HTML ESCAPE
====================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;

}


/* ======================================
   PAGE LOAD CONFIRMATION
====================================== */

window.addEventListener(
    "load",
    function () {

        console.log(
            "✅ FoodHub Menu Loaded Successfully"
        );


        const currentCart =
            localStorage.getItem(
                "cart"
            );


        console.log(
            "🛒 Current Cart:",
            currentCart
        );

    }
);