import { print, doc_child } from "../js/utils.js";

/// This script sets up the menu interactions that were lifted off free scripts, like dark-mode loading.
/// Modifications were made however to make certain actions load videos instead of images.

(function () {
    const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

// Ran after all loaded
document.addEventListener('DOMContentLoaded', function() {
    const navbarToggle = doc_child('navbarToggle')!;
    const navbarMenu = doc_child('navbarMenu')!;

    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            navbarToggle.classList.toggle('is-active');
            navbarMenu.classList.toggle('is-active');
        });
    }
});

// FIXME: add rate limiter (since client, not very needed)

const contactForm = document.getElementById("contactForm")! as HTMLFormElement

contactForm.addEventListener("submit", async function(event : SubmitEvent) {
    event.preventDefault();

    const status = document.getElementById("formStatus")!;
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(
            "https://formsubmit.co/ajax/converttosonus@gmail.com",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        
        const result = await response.json();

        if (result.success == true) {
            status.textContent = "Message sent successfully!";
            status.style.color = "#00deff";
            contactForm.reset();
        } else {
            status.textContent = result.message || "Sending failed!";
            status.style.color = "red";
        }

    } catch (error) {
        console.error(error);
        status.textContent = "Something went wrong!";
        status.style.color = "red";
    }
});
