
"use strict";

document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------------
    // 1. Greeting interaction
    // ----------------------------------------
    const greetingButton = document.getElementById("greeting-button");

    if (greetingButton) {
        greetingButton.addEventListener("click", function () {
            alert(
                "Welcome to WebTech Studio — a Web Technologies project by Charles Owajoba."
            );
        });
    }

    // ----------------------------------------
    // 2. Break suggestion tool
    // ----------------------------------------
    const breakDuration = document.getElementById("break-duration");
    const breakResult = document.getElementById("break-result");
    const breakCount = document.getElementById("break-count");
    const suggestBreakButton = document.getElementById("suggest-break");

    let totalSuggestions = 0;
    let previousSuggestion = "";

    const breakSuggestions = {
        "2": [
            "Stand up and stretch your shoulders.",
            "Rest your eyes by looking away from the screen.",
            "Take a few slow, comfortable breaths."
        ],
        "5": [
            "Take a short walk and stretch your legs.",
            "Drink some water and rest your eyes.",
            "Step away from your desk for a few minutes."
        ],
        "10": [
            "Take a ten-minute walk if it is safe to do so.",
            "Prepare a drink and enjoy a screen-free break.",
            "Do some gentle stretches before returning to work."
        ]
    };

    if (breakDuration && breakResult && breakCount && suggestBreakButton) {
        suggestBreakButton.addEventListener("click", function () {
            const options = breakSuggestions[breakDuration.value];

            if (!options) {
                breakResult.textContent = "Please select a valid break duration.";
                return;
            }

            const alternatives = options.filter(function (suggestion) {
                return suggestion !== previousSuggestion;
            });

            const availableOptions = alternatives.length ? alternatives : options;
            const randomIndex = Math.floor(Math.random() * availableOptions.length);
            const suggestion = availableOptions[randomIndex];

            previousSuggestion = suggestion;
            totalSuggestions += 1;

            breakResult.textContent =
                breakDuration.value + "-minute break: " + suggestion;

            breakCount.textContent = "Suggestions displayed: " + totalSuggestions;
        });
    }

    // ----------------------------------------
    // 3. Dog CEO public API
    // ----------------------------------------
    const DOG_API = "https://dog.ceo/api";
    const REQUEST_TIMEOUT = 12000;

    const dogButton = document.getElementById("load-dog");
    const dogImage = document.getElementById("dog-image");
    const apiStatus = document.getElementById("api-status");
    const breedForm = document.getElementById("dog-breed-form");
    const breedSelect = document.getElementById("dog-breed");
    const breedButton = document.getElementById("find-breed-dog");
    const retryBreedsButton = document.getElementById("retry-dog-breeds");

    // Separate controllers prevent unrelated API requests cancelling each other.
    const controllers = {
        breeds: null,
        image: null
    };

    function setApiStatus(message, type) {
        if (!apiStatus) return;

        apiStatus.textContent = message;
        apiStatus.classList.remove("text-danger", "text-success");

        if (type === "error") {
            apiStatus.classList.add("text-danger");
        } else if (type === "success") {
            apiStatus.classList.add("text-success");
        }
    }

    function hideDogImage() {
        if (!dogImage) return;

        dogImage.hidden = true;
        dogImage.removeAttribute("src");
        dogImage.onload = null;
        dogImage.onerror = null;
    }

    function setImageControlsDisabled(disabled) {
        if (dogButton) dogButton.disabled = disabled;
        if (breedButton) breedButton.disabled = disabled;
    }

    async function fetchDogApi(endpoint, requestType) {
        if (controllers[requestType]) {
            controllers[requestType].abort();
        }

        const controller = new AbortController();
        controllers[requestType] = controller;

        const timeoutId = setTimeout(function () {
            controller.abort();
        }, REQUEST_TIMEOUT);

        try {
            const response = await fetch(DOG_API + endpoint, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error("The API returned HTTP " + response.status + ".");
            }

            const data = await response.json();

            if (!data || data.status !== "success") {
                throw new Error("The API returned an unsuccessful response.");
            }

            return data;
        } finally {
            clearTimeout(timeoutId);

            if (controllers[requestType] === controller) {
                controllers[requestType] = null;
            }
        }
    }

    function displayDogImage(imageUrl, altText) {
        return new Promise(function (resolve, reject) {
            if (!dogImage) {
                reject(new Error("The dog image element was not found."));
                return;
            }

            let parsedUrl;

            try {
                parsedUrl = new URL(imageUrl);
            } catch {
                reject(new Error("The API returned an invalid image URL."));
                return;
            }

            if (
                parsedUrl.protocol !== "https:" ||
                parsedUrl.hostname !== "images.dog.ceo"
            ) {
                reject(new Error("The image URL did not pass validation."));
                return;
            }

            dogImage.hidden = true;
            dogImage.alt = altText;
            dogImage.onload = null;
            dogImage.onerror = null;

            dogImage.onload = function () {
                dogImage.hidden = false;
                dogImage.onload = null;
                dogImage.onerror = null;
                resolve();
            };

            dogImage.onerror = function () {
                dogImage.hidden = true;
                dogImage.onload = null;
                dogImage.onerror = null;
                reject(new Error("The dog image could not be loaded."));
            };

            dogImage.src = parsedUrl.href;
        });
    }

    function reportApiError(error) {
        console.error("[WebTech Studio] Dog API error:", error);

        if (error && error.name === "AbortError") {
            setApiStatus(
                "The request timed out or was cancelled. Please retry.",
                "error"
            );
        } else if (error instanceof TypeError) {
            setApiStatus(
                "The API could not be reached. Check your internet connection or browser network restrictions.",
                "error"
            );
        } else {
            setApiStatus(
                "The dog service could not complete the request. Please try again.",
                "error"
            );
        }
    }

    // ----------------------------------------
    // 4. Load breed options
    // ----------------------------------------
    async function loadDogBreeds() {
        if (!breedSelect || !breedButton) {
            console.warn("Breed explorer controls were not found.");
            return;
        }

        if (controllers.breeds) {
            controllers.breeds.abort();
        }

        breedSelect.disabled = true;
        breedButton.disabled = true;

        const loadingOption = document.createElement("option");
        loadingOption.value = "";
        loadingOption.textContent = "Loading available breeds...";
        loadingOption.selected = true;
        breedSelect.replaceChildren(loadingOption);

        setApiStatus("Connecting to the Dog CEO API...");

        try {
            const data = await fetchDogApi("/breeds/list/all", "breeds");

            if (
                !data.message ||
                typeof data.message !== "object" ||
                Array.isArray(data.message)
            ) {
                throw new Error("The API returned an invalid breed list.");
            }

            const breeds = Object.keys(data.message).sort();

            if (breeds.length === 0) {
                throw new Error("No breeds were returned by the API.");
            }

            const fragment = document.createDocumentFragment();
            const placeholder = document.createElement("option");

            placeholder.value = "";
            placeholder.textContent = "Choose a dog breed";
            placeholder.disabled = true;
            placeholder.selected = true;

            fragment.appendChild(placeholder);

            breeds.forEach(function (breed) {
                const option = document.createElement("option");

                option.value = breed;
                option.textContent = breed
                    .split("-")
                    .map(function (word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(" ");

                fragment.appendChild(option);
            });

            breedSelect.replaceChildren(fragment);
            breedSelect.disabled = false;
            breedButton.disabled = false;

            setApiStatus(
                breeds.length + " breeds loaded. Select one to explore its images.",
                "success"
            );
        } catch (error) {
            const errorOption = document.createElement("option");

            errorOption.value = "";
            errorOption.textContent = "Unable to load breeds — retry";
            errorOption.selected = true;

            breedSelect.replaceChildren(errorOption);
            breedSelect.disabled = true;
            breedButton.disabled = true;

            reportApiError(error);
        }
    }

    // ----------------------------------------
    // 5. Search for the selected breed
    // ----------------------------------------
    if (breedForm && breedSelect && breedButton) {
        breedForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!breedForm.checkValidity()) {
                breedForm.reportValidity();
                return;
            }

            const selectedBreed = breedSelect.value;

            if (!selectedBreed) {
                setApiStatus("Please select a dog breed first.", "error");
                return;
            }

            setImageControlsDisabled(true);
            hideDogImage();

            const readableBreed = selectedBreed.replace(/-/g, " ");
            setApiStatus("Finding a " + readableBreed + "...");

            try {
                const endpoint =
                    "/breed/" + encodeURIComponent(selectedBreed) + "/images/random";

                const data = await fetchDogApi(endpoint, "image");

                if (typeof data.message !== "string") {
                    throw new Error("The API returned an invalid image.");
                }

                await displayDogImage(data.message, "Dog breed: " + readableBreed);

                setApiStatus("Image loaded for " + readableBreed + ".", "success");
            } catch (error) {
                reportApiError(error);
            } finally {
                setImageControlsDisabled(false);
            }
        });
    }

    // ----------------------------------------
    // 6. Request a random dog image
    // ----------------------------------------
    if (dogButton) {
        dogButton.addEventListener("click", async function () {
            setImageControlsDisabled(true);
            hideDogImage();
            setApiStatus("Finding a random dog...");

            try {
                const data = await fetchDogApi("/breeds/image/random", "image");

                if (typeof data.message !== "string") {
                    throw new Error("The API returned an invalid image.");
                }

                await displayDogImage(data.message, "A randomly selected dog");

                setApiStatus("A random dog image loaded successfully.", "success");
            } catch (error) {
                reportApiError(error);
            } finally {
                setImageControlsDisabled(false);
            }
        });
    }

    if (retryBreedsButton) {
        retryBreedsButton.addEventListener("click", loadDogBreeds);
    }

    if (breedSelect && breedButton) {
        loadDogBreeds();
    }

    // ----------------------------------------
    // 7. Contact form validation
    // ----------------------------------------
    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (contactForm && formStatus) {
        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();

            formStatus.classList.remove("text-danger", "text-success");

            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                formStatus.textContent =
                    "Please check the form and complete all required fields.";
                formStatus.classList.add("text-danger");
                return;
            }

            formStatus.textContent =
                "The form passed browser-side validation. This demonstration does not send or store your information.";

            formStatus.classList.add("text-success");
        });
    }

    console.info("WebTech Studio initialised successfully.");
});
