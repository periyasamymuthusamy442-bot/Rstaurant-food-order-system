/* ======================================
   FoodHub Payment JavaScript
   MongoDB Order Integration
====================================== */


// ======================================
// PREFILL DELIVERY DETAILS
// ======================================

async function prefillDeliveryDetails() {

    try {

        const response = await fetch("/api/profile", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (data.success && data.profile) {

            const nameField =
                document.getElementById("deliveryName");

            const phoneField =
                document.getElementById("deliveryPhone");

            if (nameField && data.profile.name) {
                nameField.value = data.profile.name;
            }

            if (phoneField && data.profile.mobile) {
                phoneField.value = data.profile.mobile;
            }
        }

    } catch (error) {

        console.error("Prefill error:", error);
    }
}


// ======================================
// SHOW TOTAL AMOUNT
// ======================================

async function loadPaymentTotal() {

    const cart = JSON.parse(
        localStorage.getItem("cart")
    ) || [];


    if (cart.length === 0) {

        document.getElementById("totalAmount").innerText = "₹0";

        return;

    }


    let total = 0;


    cart.forEach(item => {

        let price = item.price;


        // Handle price like "₹249"
        if (typeof price === "string") {

            price = price
                .replace("₹", "")
                .replace(",", "")
                .trim();

        }


        total += Number(price) * Number(item.quantity || 1);

    });


    // GST

    const gst = 20;


    // Delivery charge

    const deliveryCharge = 40;


    const grandTotal =
        total +
        gst +
        deliveryCharge;


    document.getElementById("totalAmount").innerText =
        "₹" + grandTotal.toFixed(2);

}



// ======================================
// PLACE ORDER
// ======================================

async function placeOrder() {


    // ==================================
    // GET & VALIDATE DELIVERY DETAILS
    // ==================================

    const deliveryName =
        document.getElementById("deliveryName").value.trim();

    const deliveryPhone =
        document.getElementById("deliveryPhone").value.trim();

    const deliveryAddress =
        document.getElementById("deliveryAddress").value.trim();

    if (!deliveryName || !deliveryPhone || !deliveryAddress) {

        alert(
            "⚠ Please fill your name, phone number and " +
            "delivery address."
        );

        return;
    }

    if (deliveryPhone.length !== 10 || isNaN(deliveryPhone)) {

        alert(
            "⚠ Please enter a valid 10-digit phone number."
        );

        return;
    }


    // ==================================
    // GET CART
    // ==================================

    const cart = JSON.parse(
        localStorage.getItem("cart")
    ) || [];


    // ==================================
    // EMPTY CART CHECK
    // ==================================

    if (cart.length === 0) {

        alert("🛒 Your Cart is Empty!");

        window.location.href = "/menu.html";

        return;

    }


    // ==================================
    // GET PAYMENT METHOD
    // ==================================

    const paymentOptions =
        document.querySelectorAll(
            'input[name="payment"]'
        );


    let paymentMethod =
        "Cash On Delivery";


    paymentOptions.forEach(option => {

        if (option.checked) {

            paymentMethod =
                option.parentElement.innerText.trim();

        }

    });


    // ==================================
    // PREPARE ORDER ITEMS
    // ==================================

    const items = cart.map(item => {

        let price = item.price;


        if (typeof price === "string") {

            price = price
                .replace("₹", "")
                .replace(",", "")
                .trim();

        }


        return {

            food_id:
                item.food_id ||
                item.id ||
                null,

            name:
                item.name || "Food Item",

            price:
                Number(price),

            quantity:
                Number(item.quantity || 1)

        };

    });


    // ==================================
    // DISABLE BUTTON
    // ==================================

    const button =
        document.querySelector(
            "button"
        );


    if (button) {

        button.disabled = true;

        button.innerText =
            "Processing...";

    }


    // ==================================
    // SEND ORDER TO FLASK
    // ==================================

    try {

        const response = await fetch(
            "/api/orders",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                credentials:
                    "same-origin",

                body: JSON.stringify({

                    items: items,

                    payment_method:
                        paymentMethod,

                    delivery_details: {
                        name: deliveryName,
                        phone: deliveryPhone,
                        address: deliveryAddress
                    }

                })

            }
        );


        // ==================================
        // LOGIN CHECK
        // ==================================

        if (response.status === 401) {

            alert(
                "⚠ Please login before placing an order."
            );


            window.location.href =
                "/login.html";


            return;

        }


        // ==================================
        // SERVER RESPONSE
        // ==================================

        const data =
            await response.json();


        console.log(
            "Order Response:",
            data
        );


        // ==================================
        // ORDER ERROR
        // ==================================

        if (!data.success) {

            alert(
                "❌ " +
                (
                    data.message ||
                    "Unable to place order."
                )
            );


            return;

        }


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "🎉 Order Placed Successfully!"
        );


        // ==================================
        // REMOVE CART
        // ==================================

        localStorage.removeItem(
            "cart"
        );


        // ==================================
        // SAVE ORDER ID TEMPORARILY
        // ==================================

        localStorage.setItem(
            "lastOrderId",
            data.order_id
        );


        // ==================================
        // GO TO SUCCESS PAGE
        // ==================================

        window.location.href =
            "/success.html";


    } catch (error) {

        console.error(
            "Place Order Error:",
            error
        );


        alert(
            "⚠ Could not connect to FoodHub server."
        );

    }


    // ==================================
    // ENABLE BUTTON
    // ==================================

    if (button) {

        button.disabled = false;

        button.innerText =
            "Place Order";

    }

}



// ======================================
// PAGE LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadPaymentTotal();

        prefillDeliveryDetails();

        console.log(
            "✅ FoodHub Payment Loaded"
        );

    }
);