document.addEventListener("DOMContentLoaded", function () {

    const profileButton =
        document.getElementById("profileButton");

    const profileDropdown =
        document.getElementById("profileDropdown");

    const cartButton =
        document.getElementById("cartButton");

    const cartCount =
        document.getElementById("cartCount");

    const logoutButton =
        document.getElementById("logoutButton");


    /* =========================
       PROFILE DROPDOWN
    ========================= */

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", function (event) {

            event.stopPropagation();

            const opened =
                profileDropdown.classList.contains("show");

            if (opened) {

                profileDropdown.classList.remove("show");

                profileButton.classList.remove("active");

                profileButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            } else {

                profileDropdown.classList.add("show");

                profileButton.classList.add("active");

                profileButton.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        });


        /* Dropdown click */
        profileDropdown.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

            }
        );


        /* Outside click */
        document.addEventListener(
            "click",
            function (event) {

                if (
                    !profileDropdown.contains(event.target) &&
                    !profileButton.contains(event.target)
                ) {

                    profileDropdown.classList.remove("show");

                    profileButton.classList.remove("active");

                    profileButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }

            }
        );


        /* ESC */
        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {

                    profileDropdown.classList.remove("show");

                    profileButton.classList.remove("active");

                    profileButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }

            }
        );
    }


    /* =========================
       CART
    ========================= */

    if (cartButton) {

        cartButton.addEventListener(
            "click",
            function () {

                window.location.href = "/cart";

            }
        );
    }


    /* =========================
       CART COUNT
    ========================= */

    function updateCartCount() {

        let cart = [];

        try {

            const savedCart =
                localStorage.getItem("cart");

            if (savedCart) {

                cart = JSON.parse(savedCart);

            }

        } catch (error) {

            console.error(
                "Cart error:",
                error
            );

            cart = [];
        }


        if (!Array.isArray(cart)) {

            cart = [];

        }


        let total = 0;


        cart.forEach(function (item) {

            if (!item) {
                return;
            }

            const quantity =
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                );

            if (!isNaN(quantity)) {

                total += quantity;

            }

        });


        if (cartCount) {

            cartCount.textContent = total;

        }
    }


    updateCartCount();


    /* =========================
       STORAGE UPDATE
    ========================= */

    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === "cart") {

                updateCartCount();

            }

        }
    );


    /* =========================
       LOGOUT
    ========================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    window.confirm(
                        "Are you sure you want to logout?"
                    );

                if (!confirmLogout) {
                    return;
                }

                window.location.href = "/logout";

            }
        );
    }


    console.log(
        "FoodHub Profile page loaded successfully."
    );

});