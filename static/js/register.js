/* ===========================
   SHOW / HIDE PASSWORD
=========================== */

const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.classList.remove("fa-eye");
        togglePassword.classList.add("fa-eye-slash");
    } else {
        password.type = "password";
        togglePassword.classList.remove("fa-eye-slash");
        togglePassword.classList.add("fa-eye");
    }
});

/* ===========================
   REGISTER (calls backend API)
=========================== */

const registerBtn = document.querySelector(".register-btn");

registerBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const name = document.querySelector("input[type='text']").value.trim();
    const email = document.querySelector("input[type='email']").value.trim();
    const mobile = document.querySelector("input[type='tel']").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.querySelector(".terms input").checked;

    // Empty Validation
    if (name === "" || email === "" || mobile === "" || password === "" || confirmPassword === "") {
        alert("⚠ Please fill all fields.");
        return;
    }

    // Mobile Validation
    if (mobile.length !== 10 || isNaN(mobile)) {
        alert("📱 Enter a valid 10-digit mobile number.");
        return;
    }

    // Password Match
    if (password !== confirmPassword) {
        alert("❌ Password and Confirm Password do not match.");
        return;
    }

    // Password Length
    if (password.length < 6) {
        alert("🔒 Password must be at least 6 characters.");
        return;
    }

    // Terms Check
    if (!terms) {
        alert("☑ Please accept Terms & Conditions.");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, mobile, password }),
        });

        const data = await response.json();

        if (!data.success) {
            alert("❌ " + data.message);
            return;
        }

        alert("🎉 Registration Successful!");
        window.location.href = "login.html";
    } catch (err) {
        console.error(err);
        alert("⚠ Could not reach the server. Please try again.");
    }
});

/* ===========================
   INPUT FOCUS EFFECT
=========================== */

const inputs = document.querySelectorAll("input");

inputs.forEach((input) => {
    input.addEventListener("focus", function () {
        this.style.borderColor = "#fc8019";
        this.style.boxShadow = "0 0 8px rgba(252,128,25,0.4)";
    });

    input.addEventListener("blur", function () {
        this.style.borderColor = "#ddd";
        this.style.boxShadow = "none";
    });
});

/* ===========================
   PAGE LOADED
=========================== */

window.onload = function () {
    console.log("✅ FoodHub Register Page Loaded");
};
