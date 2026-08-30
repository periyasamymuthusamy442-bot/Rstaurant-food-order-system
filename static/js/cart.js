/* ======================================
   FoodHub Cart JavaScript
====================================== */


/* ======================================
   GET CART FROM LOCAL STORAGE
====================================== */

function getCart() {

    try {

        const savedCart =
            localStorage.getItem("cart");

        if (!savedCart) {
            return [];
        }

        const parsedCart =
            JSON.parse(savedCart);

        return Array.isArray(parsedCart)
            ? parsedCart
            : [];

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        return [];

    }

}


/* ======================================
   CART VARIABLES
====================================== */

let cart = getCart();


/* ======================================
   HTML ELEMENTS
====================================== */

const cartItems =
    document.getElementById("cartItems");

const itemTotal =
    document.getElementById("itemTotal");

const grandTotal =
    document.getElementById("grandTotal");


/* ======================================
   DISPLAY CART
====================================== */

function displayCart() {

    if (!cartItems) {

        console.error(
            "cartItems element not found."
        );

        return;
    }


    cartItems.innerHTML = "";


    let total = 0;


    /* ==================================
       EMPTY CART
    ================================== */

    if (
        !cart ||
        cart.length === 0
    ) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h2>
                    Your Cart is Empty
                </h2>

                <p>
                    Add your favourite food
                    to continue.
                </p>

                <button
                    onclick="goToMenu()"
                >
                    Go To Menu
                </button>

            </div>

        `;


        if (itemTotal) {
            itemTotal.innerHTML = "₹0";
        }


        if (grandTotal) {
            grandTotal.innerHTML = "₹0";
        }


        return;

    }


    /* ==================================
       DISPLAY EACH ITEM
    ================================== */

    cart.forEach(
        function (item, index) {

            /* --------------------------
               PRICE
            -------------------------- */

            const price =
                Number(item.price) || 0;


            /* --------------------------
               QUANTITY
            -------------------------- */

            const quantity =
                Number(
                    item.quantity
                ) || 1;


            /* --------------------------
               ITEM TOTAL
            -------------------------- */

            const itemPrice =
                price * quantity;


            total += itemPrice;


            /* --------------------------
               IMAGE
            -------------------------- */

            let image =
                item.image || "";


            if (
                image &&
                !image.startsWith("http") &&
                !image.startsWith("/")
            ) {

                image =
                    "/static/" + image;

            }


            /* --------------------------
               CART CARD
            -------------------------- */

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "cart-card";


            card.innerHTML = `

                <div class="cart-image">

                    <img
                        src="${image}"
                        alt="${escapeHTML(
                            item.name
                        )}"
                        onerror="
                            this.src='/static/images/logo.png';
                        "
                    >

                </div>


                <div class="cart-info">

                    <h3>
                        ${escapeHTML(
                            item.name || "Food Item"
                        )}
                    </h3>

                    <h4>
                        ₹${price.toFixed(0)}
                    </h4>

                </div>


                <div class="quantity">

                    <button
                        type="button"
                        onclick="
                            decreaseQuantity(${index})
                        "
                    >
                        −
                    </button>


                    <span>
                        ${quantity}
                    </span>


                    <button
                        type="button"
                        onclick="
                            increaseQuantity(${index})
                        "
                    >
                        +
                    </button>

                </div>


                <div class="item-total">

                    ₹${itemPrice.toFixed(0)}

                </div>


                <button
                    type="button"
                    class="remove-btn"
                    onclick="
                        removeItem(${index})
                    "
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            `;


            cartItems.appendChild(card);

        }
    );


    /* ==================================
       BILL DETAILS
    ================================== */

    const gst = 20;

    const deliveryCharge = 40;

    const finalTotal =
        total +
        gst +
        deliveryCharge;


    if (itemTotal) {

        itemTotal.innerHTML =
            "₹" +
            total.toFixed(0);

    }


    if (grandTotal) {

        grandTotal.innerHTML =
            "₹" +
            finalTotal.toFixed(0);

    }


    console.log(
        "🛒 Cart displayed:",
        cart
    );

}


/* ======================================
   INCREASE QUANTITY
====================================== */

function increaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(
            cart[index].quantity || 1
        ) + 1;


    saveCart();

    displayCart();

}


/* ======================================
   DECREASE QUANTITY
====================================== */

function decreaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    const quantity =
        Number(
            cart[index].quantity || 1
        );


    if (quantity > 1) {

        cart[index].quantity =
            quantity - 1;

    } else {

        cart.splice(
            index,
            1
        );

    }


    saveCart();

    displayCart();

}


/* ======================================
   REMOVE ITEM
====================================== */

function removeItem(index) {

    if (!cart[index]) {
        return;
    }


    const itemName =
        cart[index].name ||
        "this item";


    const confirmRemove =
        confirm(
            "Remove " +
            itemName +
            " from cart?"
        );


    if (!confirmRemove) {
        return;
    }


    cart.splice(
        index,
        1
    );


    saveCart();

    displayCart();

}


/* ======================================
   SAVE CART
====================================== */

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    console.log(
        "✅ Cart saved:",
        cart
    );

}


/* ======================================
   CHECKOUT
====================================== */

function checkout() {

    cart = getCart();


    if (
        !cart ||
        cart.length === 0
    ) {

        alert(
            "🛒 Your Cart is Empty"
        );

        return;

    }


    /*
     * Save latest cart
     */

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    /*
     * Go to payment
     */

    window.location.href =
        "/payment.html";

}


/* ======================================
   GO TO MENU
====================================== */

function goToMenu() {

    window.location.href =
        "/menu.html";

}


/* ======================================
   ESCAPE HTML
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
   PAGE LOAD
====================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Reload latest cart
         */

        cart = getCart();


        console.log(
            "🛒 Cart loaded:",
            cart
        );


        displayCart();

    }
);