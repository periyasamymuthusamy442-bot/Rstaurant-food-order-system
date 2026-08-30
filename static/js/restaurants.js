// ================= SEARCH RESTAURANT =================

const searchInput = document.getElementById("search");

searchInput.addEventListener("keyup", function () {

    let filter = searchInput.value.toLowerCase();

    let cards = document.querySelectorAll(".restaurant-card");

    cards.forEach(function(card){

        let restaurantName = card.querySelector("h3").textContent.toLowerCase();

        if(restaurantName.includes(filter)){

            card.style.display = "block";

        }

        else{

            card.style.display = "none";

        }

    });

});


// ================= VIEW MENU BUTTON =================

const menuButtons = document.querySelectorAll(".menu-btn");

menuButtons.forEach(function(button){

    button.addEventListener("click", function(){

        window.location.href = "menu.html";

    });

});


// ================= FILTER BUTTONS =================

const filterButtons = document.querySelectorAll(".filter-section button");

filterButtons.forEach(function(button){

    button.addEventListener("click", function(){

        // Active Button
        filterButtons.forEach(btn => btn.classList.remove("active"));

        this.classList.add("active");

        let value = this.innerText;

        let cards = document.querySelectorAll(".restaurant-card");

        cards.forEach(function(card){

            let text = card.innerText.toLowerCase();

            if(value === "All"){

                card.style.display = "block";

            }

            else if(value === "Veg"){

                if(text.includes("south indian") || text.includes("pizza")){

                    card.style.display = "block";

                }

                else{

                    card.style.display = "none";

                }

            }

            else if(value === "Non Veg"){

                if(text.includes("chicken") || text.includes("bbq") || text.includes("burger")){

                    card.style.display = "block";

                }

                else{

                    card.style.display = "none";

                }

            }

            else{

                // Top Rated & Fast Delivery
                card.style.display = "block";

            }

        });

    });

});