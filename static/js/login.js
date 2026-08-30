/* =========================================================
   FOODHUB LOGIN JAVASCRIPT
   Professional Login Behaviour
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const form = document.querySelector("form");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");

    const loginButton =
        document.getElementById("customerLogin");


    /* =====================================================
       PASSWORD SHOW / HIDE
    ===================================================== */

    if (togglePassword && passwordInput) {

        togglePassword.addEventListener("click", function () {

            const isPassword =
                passwordInput.type === "password";

            if (isPassword) {

                passwordInput.type = "text";

                togglePassword.classList.remove(
                    "fa-eye"
                );

                togglePassword.classList.add(
                    "fa-eye-slash"
                );

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type = "password";

                togglePassword.classList.remove(
                    "fa-eye-slash"
                );

                togglePassword.classList.add(
                    "fa-eye"
                );

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }

        });

    }


    /* =====================================================
       FORM VALIDATION
    ===================================================== */

    if (form) {

        form.addEventListener("submit", function (event) {

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value.trim()
                    : "";


            /* =============================================
               EMPTY EMAIL
            ============================================= */

            if (email === "") {

                event.preventDefault();

                showLoginMessage(
                    "Please enter your email address."
                );

                if (emailInput) {
                    emailInput.focus();
                }

                return;
            }


            /* =============================================
               EMAIL VALIDATION
            ============================================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                event.preventDefault();

                showLoginMessage(
                    "Please enter a valid email address."
                );

                if (emailInput) {
                    emailInput.focus();
                }

                return;
            }


            /* =============================================
               EMPTY PASSWORD
            ============================================= */

            if (password === "") {

                event.preventDefault();

                showLoginMessage(
                    "Please enter your password."
                );

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            /* =============================================
               PASSWORD LENGTH
            ============================================= */

            if (password.length < 6) {

                event.preventDefault();

                showLoginMessage(
                    "Password must contain at least 6 characters."
                );

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            /* =============================================
               LOGIN BUTTON LOADING
            ============================================= */

            if (loginButton) {

                loginButton.disabled = true;

                loginButton.classList.add(
                    "loading"
                );

                loginButton.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> ' +
                    'Signing in...';
            }


            /*
                IMPORTANT

                Do NOT use event.preventDefault()
                here.

                Flask will receive the form:

                POST /login

                and authenticate the user.

                After successful login Flask should
                redirect the user to:

                /home
            */

        });

    }


    /* =====================================================
       ENTER KEY SUPPORT
    ===================================================== */

    if (emailInput) {

        emailInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (passwordInput) {
                        passwordInput.focus();
                    }

                }

            }
        );

    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (form) {
                        form.requestSubmit();
                    }

                }

            }
        );

    }


    /* =====================================================
       BUTTON PRESS ANIMATION
    ===================================================== */

    const buttons =
        document.querySelectorAll(
            ".customer-btn, .admin-btn"
        );


    buttons.forEach(function (button) {

        button.addEventListener(
            "mousedown",
            function () {

                this.classList.add(
                    "button-pressed"
                );

            }
        );


        button.addEventListener(
            "mouseup",
            function () {

                this.classList.remove(
                    "button-pressed"
                );

            }
        );


        button.addEventListener(
            "mouseleave",
            function () {

                this.classList.remove(
                    "button-pressed"
                );

            }
        );

    });


    /* =====================================================
       INPUT FOCUS EFFECT
    ===================================================== */

    const inputs =
        document.querySelectorAll(
            "input"
        );


    inputs.forEach(function (input) {

        input.addEventListener(
            "focus",
            function () {

                this.parentElement?.classList.add(
                    "input-focused"
                );

            }
        );


        input.addEventListener(
            "blur",
            function () {

                this.parentElement?.classList.remove(
                    "input-focused"
                );

            }
        );

    });


    /* =====================================================
       LOGIN MESSAGE
    ===================================================== */

    function showLoginMessage(message) {

        /*
            If login page has an element:

            <div id="loginMessage"></div>

            message will be displayed there.

            Otherwise fallback to alert().
        */

        const messageBox =
            document.getElementById(
                "loginMessage"
            );


        if (messageBox) {

            messageBox.textContent =
                message;

            messageBox.classList.add(
                "show"
            );

            setTimeout(function () {

                messageBox.classList.remove(
                    "show"
                );

            }, 4000);

        } else {

            alert(message);

        }

    }


    /* =====================================================
       AUTO FOCUS
    ===================================================== */

    if (
        emailInput &&
        emailInput.value.trim() === ""
    ) {

        emailInput.focus();

    }

});