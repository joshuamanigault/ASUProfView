console.log("Content script loaded");

function findProfessors() {
    const link = document.querySelector('div.instructor.class-results-cell');
    if (link) {
        const name = link.querySelector('a').innerText.trim();
        console.log(name);
    };
}

// Run after page load
window.addEventListener('load', findProfessors);

// Observe dynamically added elements
const observer = new MutationObserver(findProfessors);
observer.observe(document.body, { childList: true, subtree: true });
