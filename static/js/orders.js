/* ======================================
   FoodHub Customer Orders JavaScript
====================================== */

const ordersContainer = document.getElementById("ordersContainer");


/* ======================================
   DEFAULT FOOD IMAGE PLACEHOLDER

   Separate default-food.jpg file thevai illa.
====================================== */

const DEFAULT_FOOD_IMAGE =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="500"
             height="500"
             viewBox="0 0 500 500">

            <rect
                width="500"
                height="500"
                fill="#f5f5f5"
            />

            <text
                x="50%"
                y="45%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-size="100">

                🍽️

            </text>

            <text
                x="50%"
                y="65%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="Arial"
                font-size="28"
                fill="#777">

                Food Image

            </text>

        </svg>
    `);



/* ======================================
   LOAD CUSTOMER ORDERS
====================================== */

async function loadOrders() {

    if (!ordersContainer) {
        return;
    }


    try {

        /* ======================================
           LOADING
        ====================================== */

        ordersContainer.innerHTML = `
            <div class="loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                <p>Loading your orders...</p>

            </div>
        `;


        /* ======================================
           FETCH ORDERS
        ====================================== */

        const response = await fetch("/api/orders", {

            method: "GET",

            credentials: "same-origin",

            headers: {
                "Accept": "application/json"
            }

        });


        /* ======================================
           LOGIN CHECK
        ====================================== */

        if (response.status === 401) {

            ordersContainer.innerHTML = `

                <div class="empty-orders">

                    <i class="fa-solid fa-lock"></i>

                    <h2>Please Login</h2>

                    <p>
                        Please login to view your orders.
                    </p>

                    <a
                        href="/login"
                        class="login-btn">

                        <i class="fa-solid fa-right-to-bracket"></i>

                        Login

                    </a>

                </div>
            `;

            return;
        }


        /* ======================================
           SERVER ERROR
        ====================================== */

        if (!response.ok) {

            throw new Error(
                "Server returned status " +
                response.status
            );

        }


        /* ======================================
           GET RESPONSE
        ====================================== */

        const data =
            await response.json();


        console.log(
            "Customer Orders:",
            data
        );


        /* ======================================
           API ERROR
        ====================================== */

        if (!data.success) {

            showErrorMessage(
                data.message ||
                "Something went wrong."
            );

            return;
        }


        /* ======================================
           NO ORDERS
        ====================================== */

        if (
            !Array.isArray(data.orders) ||
            data.orders.length === 0
        ) {

            showEmptyOrders();

            return;
        }


        /* ======================================
           DISPLAY ORDERS
        ====================================== */

        displayOrders(
            data.orders
        );


    } catch (error) {

        console.error(
            "Load Orders Error:",
            error
        );


        showConnectionError();

    }

}



/* ======================================
   DISPLAY ORDERS
====================================== */

function displayOrders(orders) {

    ordersContainer.innerHTML = "";


    let displayedOrders = 0;


    /* ======================================
       LOOP ORDERS
    ====================================== */

    orders.forEach(
        (order, orderIndex) => {

            const items =
                Array.isArray(order.items)
                    ? order.items
                    : [];


            /* ==================================
               NO ITEMS
            =================================== */

            if (items.length === 0) {

                console.warn(
                    "Order has no items:",
                    order
                );

                return;
            }


            /* ==================================
               LOOP FOOD ITEMS
            =================================== */

            items.forEach(
                (item, itemIndex) => {


                    /* ==================================
                       STATUS
                    =================================== */

                    const status =
                        normalizeStatus(
                            order.status ||
                            item.status ||
                            "Preparing"
                        );


                    const statusClass =
                        getStatusClass(
                            status
                        );


                    const step =
                        getOrderStep(
                            status
                        );


                    /* ==================================
                       FOOD NAME
                    =================================== */

                    const foodName =
                        item.name ||
                        item.food_name ||
                        item.foodName ||
                        "Food Item";


                    /* ==================================
                       FOOD IMAGE
                    =================================== */

                    const foodImage =
                        getFoodImage(
                            item
                        );


                    /* ==================================
                       QUANTITY
                    =================================== */

                    let quantity =
                        Number(
                            item.quantity
                        );


                    if (
                        !Number.isFinite(quantity) ||
                        quantity < 1
                    ) {

                        quantity = 1;

                    }


                    /* ==================================
                       PRICE
                    =================================== */

                    let itemPrice =
                        Number(
                            item.price ??
                            item.unit_price ??
                            item.unitPrice ??
                            0
                        );


                    if (
                        !Number.isFinite(itemPrice)
                    ) {

                        itemPrice = 0;

                    }


                    /* ==================================
                       ITEM TOTAL
                    =================================== */

                    let itemTotal =
                        Number(
                            item.total ??
                            item.item_total ??
                            item.subtotal ??
                            (
                                itemPrice *
                                quantity
                            )
                        );


                    if (
                        !Number.isFinite(itemTotal)
                    ) {

                        itemTotal =
                            itemPrice *
                            quantity;

                    }


                    /* ==================================
                       ORDER ID
                    =================================== */

                    const orderId =
                        order.id ||
                        order.order_id ||
                        order.orderId ||
                        (
                            "FH-" +
                            (
                                1000 +
                                orderIndex
                            )
                        );


                    /* ==================================
                       ORDER DATE
                    =================================== */

                    const orderDate =
                        order.created_at ||
                        order.createdAt ||
                        order.date ||
                        order.ordered_on ||
                        order.orderedOn ||
                        "";


                    /* ==================================
                       CREATE CARD
                    =================================== */

                    const orderCard =
                        document.createElement(
                            "div"
                        );


                    orderCard.className =
                        "order-card";


                    /* ==================================
                       CARD HTML
                    =================================== */

                    orderCard.innerHTML = `

                        <!-- FOOD IMAGE -->

                        <div class="order-image">

                            <img
                                src="${escapeHTML(foodImage)}"
                                alt="${escapeHTML(foodName)}"
                                loading="lazy"
                            >

                        </div>


                        <!-- ORDER DETAILS -->

                        <div class="order-details">


                            <!-- HEADER -->

                            <div class="order-header">

                                <h2>
                                    ${escapeHTML(
                                        foodName
                                    )}
                                </h2>


                                <span
                                    class="status ${statusClass}">

                                    ${getStatusIcon(
                                        status
                                    )}

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>

                            </div>


                            <!-- ORDER INFO -->

                            <div class="order-info">


                                <p>

                                    <i class="fa-solid fa-hashtag"></i>

                                    Order ID:

                                    <strong>
                                        ${escapeHTML(
                                            String(orderId)
                                        )}
                                    </strong>

                                </p>


                                <p>

                                    <i class="fa-solid fa-layer-group"></i>

                                    Quantity:

                                    <strong>
                                        ${quantity}
                                    </strong>

                                </p>


                                <p>

                                    <i class="fa-solid fa-indian-rupee-sign"></i>

                                    Total:

                                    <strong>
                                        ₹${itemTotal.toFixed(2)}
                                    </strong>

                                </p>


                                <p>

                                    <i class="fa-regular fa-calendar"></i>

                                    Ordered On:

                                    <strong>
                                        ${formatDate(
                                            orderDate
                                        )}
                                    </strong>

                                </p>

                            </div>


                            <!-- TRACKING -->

                            <div class="tracking">


                                <!-- PREPARING -->

                                <div
                                    class="step ${
                                        step >= 1
                                            ? "active"
                                            : ""
                                    }">

                                    <span>🔍</span>

                                    <small>
                                        Preparing
                                    </small>

                                </div>


                                <div
                                    class="line ${
                                        step >= 2
                                            ? "active"
                                            : ""
                                    }">
                                </div>


                                <!-- COOKING -->

                                <div
                                    class="step ${
                                        step >= 2
                                            ? "active"
                                            : ""
                                    }">

                                    <span>👨‍🍳</span>

                                    <small>
                                        Cooking
                                    </small>

                                </div>


                                <div
                                    class="line ${
                                        step >= 3
                                            ? "active"
                                            : ""
                                    }">
                                </div>


                                <!-- OUT FOR DELIVERY -->

                                <div
                                    class="step ${
                                        step >= 3
                                            ? "active"
                                            : ""
                                    }">

                                    <span>🛵</span>

                                    <small>
                                        Out for Delivery
                                    </small>

                                </div>


                                <div
                                    class="line ${
                                        step >= 4
                                            ? "active"
                                            : ""
                                    }">
                                </div>


                                <!-- DELIVERED -->

                                <div
                                    class="step ${
                                        step >= 4
                                            ? "active"
                                            : ""
                                    }">

                                    <span>✅</span>

                                    <small>
                                        Delivered
                                    </small>

                                </div>


                            </div>

                        </div>


                        <!-- ACTION -->

                        <div class="order-action">

                            <button
                                class="track-btn">

                                <i class="fa-solid fa-location-dot"></i>

                                Track Order

                            </button>

                        </div>

                    `;


                    /* ==================================
                       FOOD IMAGE ERROR HANDLER

                       FoodHub logo use panna maatom.
                    =================================== */

                    const imageElement =
                        orderCard.querySelector(
                            ".order-image img"
                        );


                    if (imageElement) {

                        imageElement.addEventListener(
                            "error",
                            function () {

                                if (
                                    this.dataset.fallbackApplied
                                ) {

                                    return;

                                }


                                this.dataset.fallbackApplied =
                                    "true";


                                this.src =
                                    DEFAULT_FOOD_IMAGE;

                            }
                        );

                    }


                    /* ==================================
                       TRACK BUTTON
                    =================================== */

                    const trackButton =
                        orderCard.querySelector(
                            ".track-btn"
                        );


                    if (trackButton) {

                        trackButton.addEventListener(
                            "click",
                            function () {

                                trackOrder(
                                    orderId,
                                    status
                                );

                            }
                        );

                    }


                    /* ==================================
                       ADD CARD
                    =================================== */

                    ordersContainer.appendChild(
                        orderCard
                    );


                    displayedOrders++;

                }
            );

        }
    );


    /* ======================================
       NOTHING DISPLAYED
    ====================================== */

    if (displayedOrders === 0) {

        showEmptyOrders();

    }

}



/* ======================================
   GET FOOD IMAGE
====================================== */

function getFoodImage(item) {

    if (!item) {

        return DEFAULT_FOOD_IMAGE;

    }


    /*
       IMPORTANT:

       image_url backend already generate pannina
       browser-ready URL.

       Adhanala first priority.
    */

    let image =
        item.image_url ||
        item.imageUrl ||
        item.food_image_url ||
        item.foodImageUrl ||
        item.image ||
        item.food_image ||
        item.foodImage ||
        "";


    /* ======================================
       EMPTY IMAGE
    ====================================== */

    if (
        !image ||
        String(image).trim() === ""
    ) {

        return DEFAULT_FOOD_IMAGE;

    }


    image =
        String(image)
            .trim();


    /* ======================================
       EXTERNAL URL
    ====================================== */

    if (
        image.startsWith(
            "http://"
        ) ||
        image.startsWith(
            "https://"
        ) ||
        image.startsWith(
            "data:image"
        )
    ) {

        return image;

    }


    /* ======================================
       ALREADY STATIC URL

       Example:
       /static/uploads/dosa.jpg
    ====================================== */

    if (
        image.startsWith(
            "/static/"
        )
    ) {

        return image;

    }


    /* ======================================
       static/uploads/file.jpg
    ====================================== */

    if (
        image.startsWith(
            "static/"
        )
    ) {

        return "/" + image;

    }


    /* ======================================
       /uploads/file.jpg
    ====================================== */

    if (
        image.startsWith(
            "/uploads/"
        )
    ) {

        return "/static" + image;

    }


    /* ======================================
       uploads/file.jpg
    ====================================== */

    if (
        image.startsWith(
            "uploads/"
        )
    ) {

        return "/static/" + image;

    }


    /* ======================================
       /images/file.jpg
    ====================================== */

    if (
        image.startsWith(
            "/images/"
        )
    ) {

        return "/static" + image;

    }


    /* ======================================
       images/file.jpg
    ====================================== */

    if (
        image.startsWith(
            "images/"
        )
    ) {

        return "/static/" + image;

    }


    /* ======================================
       ONLY FILE NAME

       Example:
       dosa.jpg
    ====================================== */

    return (
        "/static/images/" +
        image
    );

}



/* ======================================
   NORMALIZE STATUS
====================================== */

function normalizeStatus(status) {

    const value =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    /*
       Exact status check first.

       This prevents:
       "Out for Delivery"
       from being incorrectly treated as
       "Delivered".
    */

    if (
        value === "delivered"
    ) {

        return "Delivered";

    }


    if (
        value.includes(
            "out for delivery"
        )
    ) {

        return "Out for Delivery";

    }


    if (
        value.includes(
            "cooking"
        )
    ) {

        return "Cooking";

    }


    return "Preparing";

}



/* ======================================
   STATUS CLASS
====================================== */

function getStatusClass(status) {

    const value =
        String(
            status
        )
            .toLowerCase();


    if (
        value === "delivered"
    ) {

        return "delivered";

    }


    if (
        value.includes(
            "out for delivery"
        )
    ) {

        return "out";

    }


    if (
        value.includes(
            "cook"
        )
    ) {

        return "cooking";

    }


    return "preparing";

}



/* ======================================
   ORDER STEP
====================================== */

function getOrderStep(status) {

    const value =
        String(
            status
        )
            .toLowerCase();


    if (
        value === "delivered"
    ) {

        return 4;

    }


    if (
        value.includes(
            "out for delivery"
        )
    ) {

        return 3;

    }


    if (
        value.includes(
            "cook"
        )
    ) {

        return 2;

    }


    return 1;

}



/* ======================================
   STATUS ICON
====================================== */

function getStatusIcon(status) {

    const value =
        String(
            status
        )
            .toLowerCase();


    if (
        value === "delivered"
    ) {

        return "✅";

    }


    if (
        value.includes(
            "out for delivery"
        )
    ) {

        return "🛵";

    }


    if (
        value.includes(
            "cook"
        )
    ) {

        return "👨‍🍳";

    }


    return "🔍";

}



/* ======================================
   FORMAT DATE
====================================== */

function formatDate(dateValue) {

    if (!dateValue) {

        return "N/A";

    }


    try {

        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                dateValue
            );

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

        console.error(
            "Date Format Error:",
            error
        );


        return String(
            dateValue
        );

    }

}



/* ======================================
   TRACK ORDER
====================================== */

function trackOrder(
    orderId,
    status
) {

    alert(
        "📦 Order ID: " +
        orderId +
        "\n\n" +
        "Current Status: " +
        status
    );

}



/* ======================================
   EMPTY ORDERS
====================================== */

function showEmptyOrders() {

    if (!ordersContainer) {

        return;

    }


    ordersContainer.innerHTML = `

        <div class="empty-orders">

            <div class="empty-icon">

                <i class="fa-solid fa-box-open"></i>

            </div>


            <h2>
                No Orders Yet
            </h2>


            <p>
                You haven't placed any orders yet.
            </p>


            <a
                href="/menu"
                class="order-food-btn">

                <i class="fa-solid fa-utensils"></i>

                Browse Menu

            </a>

        </div>

    `;

}



/* ======================================
   API ERROR MESSAGE
====================================== */

function showErrorMessage(message) {

    if (!ordersContainer) {

        return;

    }


    ordersContainer.innerHTML = `

        <div class="empty-orders">

            <i class="fa-solid fa-circle-exclamation"></i>


            <h2>
                Unable to Load Orders
            </h2>


            <p>
                ${escapeHTML(
                    message
                )}
            </p>


            <button
                class="retry-btn">

                <i class="fa-solid fa-rotate-right"></i>

                Retry

            </button>

        </div>

    `;


    const retryButton =
        ordersContainer.querySelector(
            ".retry-btn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadOrders
        );

    }

}



/* ======================================
   CONNECTION ERROR
====================================== */

function showConnectionError() {

    if (!ordersContainer) {

        return;

    }


    ordersContainer.innerHTML = `

        <div class="empty-orders">

            <i class="fa-solid fa-server"></i>


            <h2>
                Connection Error
            </h2>


            <p>
                Unable to connect to FoodHub server.
            </p>


            <button
                class="retry-btn">

                <i class="fa-solid fa-rotate-right"></i>

                Retry

            </button>

        </div>

    `;


    const retryButton =
        ordersContainer.querySelector(
            ".retry-btn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadOrders
        );

    }

}



/* ======================================
   HTML ESCAPE
====================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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



/* ======================================
   INITIAL LOAD
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadOrders();


        console.log(
            "FoodHub Customer Orders Loaded"
        );

    }
);