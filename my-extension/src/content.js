const processedProfessors = new Set();
const professorCache = new Map();

// Find professors on the page
function findProfessors() {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    const names = [];

    instructorDivs.forEach((div, _index) => {
        const link = div.querySelector('a');
        if (link) {
            const name = link.innerText.trim();
            if (!processedProfessors.has(name)) {
                names.push(name);
            }
        }
    });

    if (names.length > 0) {
        processProfessorSequentially(names);
    }
}

// Send message to background script

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

// Process professors sequentially
async function processProfessorSequentially(names)  {
    for (const name of names) {
        if (processedProfessors.has(name)) {
            console.log('Skipping already processed professor: ' + name);
            continue;
        }
        
        processedProfessors.add(name);
        console.log('Processing professor: ' + name);

        try {
            const response = await sendMessage({professorName: name});
            console.log('✔️ Data for: ' + name, response); 

            if (response.success) {
                professorCache.set(name, response.data);
                // Add visual indicator to the page
            }
        } catch (error) {
            console.error('❌ Error fetching data for: ' + name, error);
        }
    }
}

// Add visual indicator to the page
function injectProfessorCards(name, data) {

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
