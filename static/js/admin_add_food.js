// =========================================================
// FOODHUB - ADMIN ADD FOOD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("addFoodForm");

    if (!form) {
        console.error("Add food form not found.");
        return;
    }


    // =====================================================
    // FORM SUBMIT
    // =====================================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();


        const submitButton =
            form.querySelector(".submit-btn");


        // -------------------------------------------------
        // GET FORM VALUES
        // -------------------------------------------------

        const foodName =
            document.getElementById("foodName").value.trim();

        const category =
            document.getElementById("category").value;

        const price =
            document.getElementById("price").value;

        const description =
            document.getElementById("description").value.trim();

        const imageInput =
            document.getElementById("image");


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!foodName) {
            alert("Please enter food name.");
            document.getElementById("foodName").focus();
            return;
        }


        if (!category) {
            alert("Please select a category.");
            document.getElementById("category").focus();
            return;
        }


        if (!price || Number(price) <= 0) {
            alert("Please enter a valid price.");
            document.getElementById("price").focus();
            return;
        }


        // -------------------------------------------------
        // IMAGE VALIDATION
        // -------------------------------------------------

        if (imageInput.files.length > 0) {

            const file = imageInput.files[0];

            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {

                alert(
                    "Please select a JPG, JPEG, PNG or WEBP image."
                );

                imageInput.value = "";

                return;
            }


            // Maximum 5 MB

            const maxSize =
                5 * 1024 * 1024;

            if (file.size > maxSize) {

                alert(
                    "Image size must be less than 5 MB."
                );

                imageInput.value = "";

                return;
            }
        }


        // -------------------------------------------------
        // CREATE FORM DATA
        // -------------------------------------------------

        const formData = new FormData();

        formData.append("name", foodName);

        formData.append(
            "category",
            category
        );

        formData.append(
            "price",
            price
        );

        formData.append(
            "description",
            description
        );


        if (imageInput.files.length > 0) {

            formData.append(
                "image",
                imageInput.files[0]
            );
        }


        // -------------------------------------------------
        // DISABLE BUTTON
        // -------------------------------------------------

        const originalText =
            submitButton.innerHTML;

        submitButton.disabled = true;

        submitButton.innerHTML =
            "⏳ Adding Food...";


        // -------------------------------------------------
        // SEND TO FLASK
        // -------------------------------------------------

        try {

            const response = await fetch(
                "/api/admin/foods",
                {
                    method: "POST",
                    credentials: "same-origin",
                    body: formData
                }
            );


            // ------------------------------------------------
            // ADMIN LOGIN CHECK
            // ------------------------------------------------

            if (response.status === 401) {

                alert("⚠ Please login as admin first.");

                window.location.href = "/admin_login.html";

                return;
            }


            // ------------------------------------------------
            // RESPONSE
            // ------------------------------------------------

            let data;

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.error(
                    "Invalid JSON response:",
                    jsonError
                );

                alert(
                    "Server returned an invalid response."
                );

                return;
            }


            // ------------------------------------------------
            // SUCCESS
            // ------------------------------------------------

            if (
                response.ok &&
                data.success
            ) {

                alert(
                    data.message ||
                    "Food item added successfully!"
                );


                // Go back to dashboard

                window.location.href =
                    "/admin/dashboard";

                return;
            }


            // ------------------------------------------------
            // ERROR
            // ------------------------------------------------

            alert(
                data.message ||
                "Unable to add food item."
            );


        } catch (error) {

            console.error(
                "Add food error:",
                error
            );

            alert(
                "Unable to connect to server. Please try again."
            );


        } finally {

            submitButton.disabled = false;

            submitButton.innerHTML =
                originalText;
        }

    });


    // =====================================================
    // IMAGE FILE NAME DISPLAY
    // =====================================================

    const imageInput =
        document.getElementById("image");


    if (imageInput) {

        imageInput.addEventListener(
            "change",
            function () {

                if (this.files.length > 0) {

                    const file =
                        this.files[0];

                    console.log(
                        "Selected image:",
                        file.name
                    );
                }

            }
        );
    }

});