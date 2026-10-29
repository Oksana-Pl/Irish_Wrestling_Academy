/* Small enhancements. Pages, navigation and FAQs work without JavaScript. */
document.documentElement.classList.add("js");

function setupNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".site-nav");
    if (!toggle || !navigation) return;

    function closeMenu(returnFocus = false) {
        toggle.setAttribute("aria-expanded", "false");
        navigation.classList.remove("is-open");
        toggle.innerHTML = 'Menu <span class="menu-icon" aria-hidden="true"></span>';
        if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        navigation.classList.toggle("is-open", !isOpen);
        toggle.innerHTML = isOpen
            ? 'Menu <span class="menu-icon" aria-hidden="true"></span>'
            : 'Close <span class="menu-icon" aria-hidden="true"></span>';
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            closeMenu(true);
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".site-header")) closeMenu();
    });

    const desktop = window.matchMedia("(min-width: 761px)");
    desktop.addEventListener("change", () => closeMenu());
}

function setupEnquiryReview() {
    const form = document.querySelector(".contact-form");
    if (!form) return;

    const interest = form.querySelector("#interest");
    const result = document.querySelector("#form-result");
    const submit = form.querySelector("button[type='submit']");
    const params = new URLSearchParams(window.location.search);
    const selectedInterest = params.get("interest");
    const validInterests = ["kids", "adults", "first-class", "events", "other"];

    if (validInterests.includes(selectedInterest)) interest.value = selectedInterest;
    submit.disabled = false;

    // The prototype deliberately has no endpoint and stores no personal data.
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        result.replaceChildren();
        const heading = document.createElement("h3");
        heading.textContent = "Review your enquiry";
        const summary = document.createElement("p");
        summary.className = "enquiry-message";
        const data = new FormData(form);
        summary.textContent = [
            `Name: ${data.get("name")}`,
            `Email: ${data.get("email")}`,
            data.get("phone") ? `Phone: ${data.get("phone")}` : null,
            `Interested in: ${interest.selectedOptions[0].textContent}`,
            "",
            data.get("message")
        ].filter((item) => item !== null).join("\n");
        result.append(heading, summary);
        result.hidden = false;
    });
}

setupNavigation();
setupEnquiryReview();

function setupReveal() {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window) || !Element.prototype.animate) return;

    const selectors = [
        ".hero__content", ".page-hero__layout > *", ".page-hero > .container > h1",
        ".page-hero > .container > h1 + p", ".section-intro > *", ".section-heading",
        ".class-card", ".coach-card", ".competition-feature > *", ".membership-description",
        ".membership-plan", ".timetable-section .container", ".first-class-grid .step",
        ".faq-layout > *", ".event-card", ".contact-info", ".contact-form",
        ".policy-section .container", ".cta-inner > *"
    ];
    const pending = new Set(document.querySelectorAll(selectors.join(", ")));
    const running = new Map();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            observer.unobserve(target);
            pending.delete(target);
            const siblings = [...target.parentElement.children].filter((item) =>
                item.matches(".class-card, .coach-card, .event-card, .step")
            );
            const delay = Math.max(0, siblings.indexOf(target)) * 100;
            const animation = target.animate([
                { opacity: 0, transform: "translateY(40px)" },
                { opacity: 1, transform: "translateY(0)" }
            ], { duration: 800, easing: "ease", delay, fill: "backwards" });
            running.set(target, animation);
            animation.onfinish = () => running.delete(target);
        });
    }, { rootMargin: "0px 0px -50px 0px", threshold: 0 });

    pending.forEach((element) => observer.observe(element));

    function revealTarget(element) {
        if (!element) return;
        pending.forEach((target) => {
            if (target === element || target.contains(element) || element.contains(target)) {
                observer.unobserve(target);
                pending.delete(target);
            }
        });
        running.forEach((animation, target) => {
            if (target === element || target.contains(element) || element.contains(target)) {
                animation.cancel();
                running.delete(target);
            }
        });
    }

    function revealHash() {
        let id;
        try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
        revealTarget(document.getElementById(id));
    }

    document.addEventListener("focusin", (event) => revealTarget(event.target));
    window.addEventListener("hashchange", revealHash);
    revealHash();
    motion.addEventListener("change", ({ matches }) => {
        if (!matches) return;
        observer.disconnect();
        pending.clear();
        running.forEach((animation) => animation.cancel());
        running.clear();
    });
}

setupReveal();
