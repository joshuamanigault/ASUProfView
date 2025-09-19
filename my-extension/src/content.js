(async () => {
    try {
        const response = await chrome.runtime.sendMessage({professorName: "Soumya Indela"});
        console.log(response);
    } catch (error) {
        console.error("Error sending message:", error);
    }
  })();

function findProfessors() {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    //console.log(`Found ${instructorDivs.length} instructor divs`);
    
    instructorDivs.forEach((div, index) => {
        const link = div.querySelector('a');
        if (link) {
            const name = link.innerText.trim();
            // console.log(`Professor ${index + 1}: ${name}`);
        }
    });
}

// Run after page load
window.addEventListener('load', findProfessors);

// Also run immediately in case the page is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findProfessors);
} else {
    findProfessors();
}

// Observe dynamically added elements
const observer = new MutationObserver(findProfessors);
observer.observe(document.body, { childList: true, subtree: true });
