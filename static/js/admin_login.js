/* =========================================
   FoodHub Professional Admin Login JS
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       PASSWORD SHOW / HIDE
    ========================================= */

    const password =
        document.getElementById("adminPassword");

    const togglePassword =
        document.getElementById("toggleAdminPassword");


    if (password && togglePassword) {

        togglePassword.addEventListener(
            "click",
            function () {

                if (password.type === "password") {

                    password.type = "text";

                    togglePassword.classList.remove(
                        "fa-eye"
                    );

                    togglePassword.classList.add(
                        "fa-eye-slash"
                    );

                } else {

                    password.type = "password";

                    togglePassword.classList.remove(
                        "fa-eye-slash"
                    );

                    togglePassword.classList.add(
                        "fa-eye"
                    );

                }

            }
        );

    }


    /* =========================================
       ADMIN LOGIN FORM
    ========================================= */

    const form =
        document.querySelector("form");


    if (!form) {

        console.error(
            "❌ Admin login form not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* =================================
               GET INPUT VALUES
            ================================= */

            const username =
                document
                    .getElementById("adminUsername")
                    .value
                    .trim();


            const passwordValue =
                document
                    .getElementById("adminPassword")
                    .value
                    .trim();


            /* =================================
               VALIDATION
            ================================= */

            if (
                username === "" ||
                passwordValue === ""
            ) {

                alert(
                    "⚠ Please enter Username and Password."
                );

                return;

            }


            /* =================================
               LOGIN BUTTON
            ================================= */

            const loginButton =
                document.querySelector(
                    ".admin-login-btn"
                );


            const originalButton =
                loginButton.innerHTML;


            loginButton.disabled = true;


            loginButton.innerHTML =
                `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Signing in...
                `;


            /* =================================
               FLASK ADMIN LOGIN API
            ================================= */

            try {

                const response =
                    await fetch(
                        "/api/admin/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body: JSON.stringify({

                                username: username,

                                password:
                                    passwordValue

                            })
                        }
                    );


                /* =================================
                   RESPONSE
                ================================= */

                const data =
                    await response.json();


                /* =================================
                   LOGIN SUCCESS
                ================================= */

                if (
                    response.ok &&
                    data.success
                ) {

                    /*
                     * Save admin login status
                     */

                    localStorage.setItem(
                        "adminLoggedIn",
                        "true"
                    );


                    if (data.admin) {

                        localStorage.setItem(
                            "adminUsername",
                            data.admin.username ||
                            username
                        );

                    } else {

                        localStorage.setItem(
                            "adminUsername",
                            username
                        );

                    }


                    alert(
                        "✅ Admin Login Successful!"
                    );


                    /*
                     * Open Admin Dashboard
                     */

                    window.location.href =
                        "/admin_dashboard.html";


                    return;

                }


                /* =================================
                   LOGIN FAILED
                ================================= */

                alert(
                    "❌ " +
                    (
                        data.message ||
                        "Invalid Username or Password."
                    )
                );


                loginButton.disabled =
                    false;

                loginButton.innerHTML =
                    originalButton;

            }


            /* =================================
               SERVER ERROR
            ================================= */

            catch (error) {

                console.error(
                    "❌ Admin Login Error:",
                    error
                );


                alert(
                    "⚠ Could not connect to the server. " +
                    "Please make sure Flask server is running."
                );


                loginButton.disabled =
                    false;

                loginButton.innerHTML =
                    originalButton;

            }

        }
    );


    /* =========================================
       BUTTON CLICK EFFECT
    ========================================= */

    const loginButton =
        document.querySelector(
            ".admin-login-btn"
        );


    if (loginButton) {

        loginButton.addEventListener(
            "mousedown",
            function () {

                if (!this.disabled) {

                    this.style.transform =
                        "scale(0.98)";

                }

            }
        );


        loginButton.addEventListener(
            "mouseup",
            function () {

                this.style.transform =
                    "";

            }
        );


        loginButton.addEventListener(
            "mouseleave",
            function () {

                this.style.transform =
                    "";

            }
        );

    }


});