/* =====================================================
   FOODHUB HOME JAVASCRIPT
===================================================== */


/* =====================================================
   HERO SLIDER
===================================================== */

const slides = document.querySelectorAll(".hero-slide");
const dots = document.querySelectorAll(".dot");

const nextSlideBtn = document.getElementById("nextSlide");
const prevSlideBtn = document.getElementById("prevSlide");

let currentSlide = 0;
let slideTimer;


function showSlide(index) {

    if (!slides.length) return;

    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }


    slides.forEach((slide, i) => {

        slide.classList.toggle(
            "active",
            i === currentSlide
        );

    });


    dots.forEach((dot, i) => {

        dot.classList.toggle(
            "active",
            i === currentSlide
        );

    });

}


function nextSlide() {

    showSlide(currentSlide + 1);

}


function previousSlide() {

    showSlide(currentSlide - 1);

}


function startSlider() {

    stopSlider();

    slideTimer = setInterval(() => {

        nextSlide();

    }, 5000);

}


function stopSlider() {

    if (slideTimer) {

        clearInterval(slideTimer);

    }

}


if (nextSlideBtn) {

    nextSlideBtn.addEventListener(
        "click",
        () => {

            nextSlide();
            startSlider();

        }
    );

}


if (prevSlideBtn) {

    prevSlideBtn.addEventListener(
        "click",
        () => {

            previousSlide();
            startSlider();

        }
    );

}


dots.forEach((dot, index) => {

    dot.addEventListener(
        "click",
        () => {

            showSlide(index);
            startSlider();

        }
    );

});


showSlide(0);
startSlider();



/* =====================================================
   RESTAURANT SEARCH
   IMPORTANT:
   Search only filters restaurant cards.
   It will NOT redirect to menu.
===================================================== */

const restaurantSearch =
    document.getElementById("restaurantSearch");

const clearSearch =
    document.getElementById("clearSearch");

const restaurantCards =
    document.querySelectorAll(".restaurant-card");

const noRestaurant =
    document.getElementById("noRestaurant");

const searchResultMessage =
    document.getElementById("searchResultMessage");


function searchRestaurants() {

    const searchValue =
        restaurantSearch.value
            .trim()
            .toLowerCase();


    let foundCount = 0;


    restaurantCards.forEach(card => {

        const restaurantName =
            card.dataset.name
                ? card.dataset.name.toLowerCase()
                : "";

        const restaurantCategory =
            card.dataset.category
                ? card.dataset.category.toLowerCase()
                : "";


        const searchableText =
            restaurantName +
            " " +
            restaurantCategory;


        const matched =
            searchValue === "" ||
            searchableText.includes(searchValue);


        if (matched) {

            card.style.display = "";

            foundCount++;

        } else {

            card.style.display = "none";

        }

    });


    /* NO RESULT */

    if (searchValue !== "" && foundCount === 0) {

        noRestaurant.style.display = "block";

        searchResultMessage.textContent =
            `No restaurants found for "${restaurantSearch.value}"`;

    } else {

        noRestaurant.style.display = "none";

        if (searchValue !== "") {

            searchResultMessage.textContent =
                `${foundCount} restaurant${foundCount > 1 ? "s" : ""} found`;

        } else {

            searchResultMessage.textContent = "";

        }

    }

}


if (restaurantSearch) {

    restaurantSearch.addEventListener(
        "input",
        searchRestaurants
    );

}


if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            restaurantSearch.value = "";

            searchRestaurants();

            restaurantSearch.focus();

        }
    );

}



/* =====================================================
   NAV SEARCH BUTTON
   Scrolls to restaurant search only.
===================================================== */

const navSearchBtn =
    document.getElementById("navSearchBtn");


if (navSearchBtn) {

    navSearchBtn.addEventListener(
        "click",
        () => {

            const searchSection =
                document.querySelector(
                    ".restaurant-search-section"
                );

            if (searchSection) {

                searchSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

            setTimeout(() => {

                if (restaurantSearch) {

                    restaurantSearch.focus();

                }

            }, 500);

        }
    );

}



/* =====================================================
   PROFILE MENU
===================================================== */

const profileBtn =
    document.getElementById("profileBtn");

const profileMenu =
    document.getElementById("profileMenu");


if (profileBtn && profileMenu) {

    profileBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !profileMenu.contains(event.target) &&
                !profileBtn.contains(event.target)
            ) {

                profileMenu.classList.remove(
                    "show"
                );

            }

        }
    );

}



/* =====================================================
   LOAD USER SESSION
===================================================== */

async function loadUserSession() {

    try {

        const response =
            await fetch("/api/session");

        if (!response.ok) {

            return;

        }

        const data =
            await response.json();


        /*
           Different backend response formats
           are supported.
        */

        const user =
            data.user ||
            data.customer ||
            data;


        if (
            data.logged_in === false ||
            data.authenticated === false
        ) {

            return;

        }


        const username =
            user.username ||
            user.name ||
            user.email ||
            "User";


        const letter =
            username
                .charAt(0)
                .toUpperCase();


        const accountLetter =
            document.getElementById(
                "accountLetter"
            );

        const profileLetter =
            document.getElementById(
                "profileLetter"
            );

        const profileName =
            document.getElementById(
                "profileName"
            );


        if (accountLetter) {

            accountLetter.textContent =
                letter;

        }


        if (profileLetter) {

            profileLetter.textContent =
                letter;

        }


        if (profileName) {

            profileName.textContent =
                username;

        }

    } catch (error) {

        console.error(
            "Session loading error:",
            error
        );

    }

}


loadUserSession();



/* =====================================================
   LOGOUT
===================================================== */

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                const response =
                    await fetch(
                        "/api/logout",
                        {
                            method: "POST"
                        }
                    );


                if (response.ok) {

                    window.location.href =
                        "/login.html";

                } else {

                    alert(
                        "Logout failed. Please try again."
                    );

                }

            } catch (error) {

                console.error(error);

                alert(
                    "Something went wrong during logout."
                );

            }

        }
    );

}



/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

    const cartCount =
        document.getElementById("cartCount");


    if (!cartCount) return;


    try {

        const cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];


        let count = 0;


        cart.forEach(item => {

            count +=
                Number(item.quantity) || 1;

        });


        cartCount.textContent =
            count;

    } catch (error) {

        cartCount.textContent = "0";

    }

}


updateCartCount();



/* =====================================================
   SCROLL TOP
===================================================== */

const scrollTopBtn =
    document.getElementById("scrollTopBtn");


window.addEventListener(
    "scroll",
    () => {

        if (!scrollTopBtn) return;


        if (window.scrollY > 500) {

            scrollTopBtn.classList.add(
                "show"
            );

        } else {

            scrollTopBtn.classList.remove(
                "show"
            );

        }

    }
);


if (scrollTopBtn) {

    scrollTopBtn.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}



/* =====================================================
   PAUSE SLIDER WHEN USER LEAVES PAGE
===================================================== */

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopSlider();

        } else {

            startSlider();

        }

    }
);
// =========================================
// PROFILE DROPDOWN
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const profileBtn = document.getElementById("accountBtn");
    const profileMenu = document.getElementById("profileMenu");

    if (!profileBtn || !profileMenu) {
        return;
    }

    profileBtn.addEventListener("click", function (event) {

        event.stopPropagation();

        profileMenu.classList.toggle("show");

    });


    document.addEventListener("click", function (event) {

        if (
            !profileMenu.contains(event.target) &&
            !profileBtn.contains(event.target)
        ) {

            profileMenu.classList.remove("show");

        }

    });

});