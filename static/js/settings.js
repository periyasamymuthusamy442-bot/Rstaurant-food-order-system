/* ======================================
   FoodHub Settings JavaScript
====================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadProfile();
    setupProfileForm();
    setupPasswordForm();

});


/* ======================================
   LOAD CURRENT PROFILE (prefill mobile)
====================================== */

async function loadProfile() {

    try {

        const response = await fetch("/api/profile", {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await response.json();

        if (data.success && data.profile) {

            const mobileField =
                document.getElementById("settingsMobile");

            if (mobileField && data.profile.mobile) {
                mobileField.value = data.profile.mobile;
            }
        }

    } catch (error) {

        console.error("Load profile error:", error);
    }
}


/* ======================================
   PROFILE INFO FORM
====================================== */

function setupProfileForm() {

    const form = document.getElementById("profileForm");
    const msg = document.getElementById("profileMsg");
    const saveBtn = document.getElementById("profileSaveBtn");

    if (!form) return;

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("settingsName").value.trim();
        const mobile = document.getElementById("settingsMobile").value.trim();

        if (!name) {
            showMessage(msg, "Please enter your name.", false);
            return;
        }

        saveBtn.disabled = true;

        try {

            const response = await fetch("/api/profile/update", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, mobile })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(msg, data.message || "Profile updated!", true);
            } else {
                showMessage(msg, data.message || "Unable to update profile.", false);
            }

        } catch (error) {

            console.error("Profile update error:", error);
            showMessage(msg, "Could not reach the server.", false);

        } finally {

            saveBtn.disabled = false;
        }
    });
}


/* ======================================
   PASSWORD FORM
====================================== */

function setupPasswordForm() {

    const form = document.getElementById("passwordForm");
    const msg = document.getElementById("passwordMsg");
    const saveBtn = document.getElementById("passwordSaveBtn");

    if (!form) return;

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        if (!currentPassword || !newPassword) {
            showMessage(msg, "Please fill both password fields.", false);
            return;
        }

        if (newPassword.length < 6) {
            showMessage(msg, "New password must be at least 6 characters.", false);
            return;
        }

        saveBtn.disabled = true;

        try {

            const response = await fetch("/api/profile/password", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage(msg, data.message || "Password updated!", true);
                form.reset();
            } else {
                showMessage(msg, data.message || "Unable to update password.", false);
            }

        } catch (error) {

            console.error("Password update error:", error);
            showMessage(msg, "Could not reach the server.", false);

        } finally {

            saveBtn.disabled = false;
        }
    });
}


/* ======================================
   MESSAGE HELPER
====================================== */

function showMessage(element, text, success) {

    if (!element) return;

    element.textContent = text;
    element.className = "settings-msg " + (success ? "success" : "error");
}
