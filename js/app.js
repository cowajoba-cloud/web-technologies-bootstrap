// Greeting button
        document.getElementById("greeting-button")
            .addEventListener("click", function () {
                alert("Hello! My Bootstrap web app works.");
            });

        // Break suggestion tool
        const breakDuration = document.getElementById("break-duration");
        const breakResult = document.getElementById("break-result");
        const breakCount = document.getElementById("break-count");

        let totalSuggestions = 0;
        let previousSuggestion = "";

        const breakSuggestions = {
            2: [
                "Stand up and stretch your shoulders.",
                "Rest your eyes by looking away from the screen.",
                "Take a few slow, comfortable breaths."
            ],
            5: [
                "Take a short walk and stretch your legs.",
                "Drink some water and rest your eyes.",
                "Step away from your desk for a few minutes."
            ],
            10: [
                "Take a ten-minute walk if it is safe to do so.",
                "Prepare a drink and enjoy a screen-free break.",
                "Do some gentle stretches before returning to work."
            ]
        };

        document.getElementById("suggest-break")
            .addEventListener("click", function () {
                const options = breakSuggestions[breakDuration.value];

                const alternatives = options.filter(function (item) {
                    return item !== previousSuggestion;
                });

                const availableOptions = alternatives.length
                    ? alternatives
                    : options;

                const suggestion = availableOptions[
                    Math.floor(Math.random() * availableOptions.length)
                ];

                previousSuggestion = suggestion;
                totalSuggestions++;

                breakResult.textContent =
                    breakDuration.value + "-minute break: " + suggestion;

                breakCount.textContent =
                    "Suggestions displayed: " + totalSuggestions;
            });

        // Public Dog CEO API
        const dogButton = document.getElementById("load-dog");
        const dogImage = document.getElementById("dog-image");
        const apiStatus = document.getElementById("api-status");

        dogButton.addEventListener("click", async function () {
            dogButton.disabled = true;
            dogImage.hidden = true;
            apiStatus.className = "mt-3 mb-2";
            apiStatus.textContent = "Loading a dog picture...";

            try {
                const response = await fetch(
                    "https://dog.ceo/api/breeds/image/random"
                );

                if (!response.ok) {
                    throw new Error("The API request failed.");
                }

                const data = await response.json();

                if (
                    data.status !== "success" ||
                    typeof data.message !== "string"
                ) {
                    throw new Error("The API response was invalid.");
                }

                const imageUrl = new URL(data.message);

                if (
                    imageUrl.protocol !== "https:" ||
                    imageUrl.hostname !== "images.dog.ceo"
                ) {
                    throw new Error("Unexpected image URL.");
                }

                dogImage.onload = function () {
                    dogImage.hidden = false;
                    apiStatus.textContent =
                        "Dog picture loaded successfully.";
                };

                dogImage.onerror = function () {
                    dogImage.hidden = true;
                    apiStatus.textContent =
                        "The image could not be displayed. Please try again.";
                    apiStatus.className = "mt-3 mb-2 text-danger";
                };

                dogImage.src = imageUrl.href;
            } catch (error) {
                apiStatus.textContent =
                    "Unable to load a picture. Check your connection and retry.";
                apiStatus.className = "mt-3 mb-2 text-danger";
                console.error("Dog API error:", error);
            } finally {
                dogButton.disabled = false;
            }
        });

        // Contact form validation
        const contactForm = document.getElementById("contact-form");
        const formStatus = document.getElementById("form-status");

        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();

            formStatus.className = "mt-3";

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                formStatus.textContent =
                    "Please complete the required fields correctly.";
                formStatus.classList.add("text-danger");
                return;
            }

            formStatus.textContent =
                "Validation successful. No information was sent or stored.";
            formStatus.classList.add("text-success");
        });
