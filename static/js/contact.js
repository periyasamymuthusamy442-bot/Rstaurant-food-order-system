/* ======================================
   FoodHub Contact JavaScript
   Sends feedback to /api/contact so it is
   saved in the "contact_messages" MongoDB collection
====================================== */

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contactForm");

    if (!form) {
        console.error("Contact form not found.");
        return;
    }

    const nameInput = document.getElementById("contactName");
    const emailInput = document.getElementById("contactEmail");
    const messageInput = document.getElementById("contactMessage");
    const submitBtn = document.getElementById("contactSubmitBtn");
    const statusMsg = document.getElementById("contactStatusMsg");

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !email || !message) {

            showStatus("⚠ Please fill all fields.", false);
            return;
        }

        const originalText = submitBtn.innerText;

        submitBtn.disabled = true;
        submitBtn.innerText = "Sending...";

        try {

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message })
            });

            const data = await response.json();

            if (data.success) {

                showStatus(
                    "✅ " + (data.message || "Your message has been sent!"),
                    true
                );

                form.reset();

            } else {

                showStatus(
                    "❌ " + (data.message || "Unable to send message."),
                    false
                );
            }

        } catch (error) {

            console.error("Contact form error:", error);

            showStatus(
                "⚠ Could not connect to the server. Please try again.",
                false
            );

        } finally {

            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    function showStatus(text, success) {

        if (!statusMsg) return;

        statusMsg.textContent = text;
        statusMsg.style.color = success ? "#16a34a" : "#dc2626";
    }
});


// Page Loaded
window.onload = function () {

    console.log("Contact Page Loaded Successfully");

};
