import styles from './content.styles.css?inline'
import { createProfessorCardTemplate, createNotFoundCardTemplate } from "./templates.js";

function findProfessors() {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    const names = [];

    instructorDivs.forEach((div) => {
        const link = div.querySelector('a');
        if (!link) return;

        // Remove hyphens and extra spaces from the name
        const rawName = link.innerText.trim();
        const normalizedName = rawName.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

        if (!div.querySelector('.rmp-card') && !names.includes(normalizedName)) {
            names.push(normalizedName);
        }
    });

    // console.debug('Names length:', names.length);
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
    if (!chrome.runtime?.id) {
        console.error('Extension context invalidated - please refresh the page');
        return;
    }

    for (const name of names) {
        try {
            const response = await sendMessage({professorName: name});
            console.debug('Data for: ' + name, response); 

            if (response?.success) {
                injectProfessorCard(name, response.data);
            } else {
                injectNotFoundCard(name, response?.error || 'Professor not found');
            }
        } catch (error) {
            if (error.message?.includes('Extension context invalidated')) {
                console.error('Extension context invalidated - please refresh the page');
                return;
            } else {
                injectNotFoundCard(name, 'Error fetching data');
            }
            console.error('Error fetching data for: ' + name, error);
        }
    }
}

function injectProfessorCard(name, data) {
    // Find all professor links with this name
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    
    instructorDivs.forEach((div) => {
        const link = div.querySelector('a');
        if (!link) return;
        
        const rawLinkName = link.innerText.trim();
        const normalizedLinkName = rawLinkName.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (normalizedLinkName !== name) return;
        if (div.querySelector('.rmp-card')) return;
        
        const card = createProfessorCard(name, data);
        link.insertAdjacentElement('afterend', card);
    });
}

function injectNotFoundCard(name, errorMessage) {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    
    instructorDivs.forEach((div) => {
        const link = div.querySelector('a');
        if (!link) return;

        const rawLinkName = link.innerText.trim();
        const normalizedLinkName = rawLinkName.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

        if (normalizedLinkName !== name) return;
        if (div.querySelector('.rmp-card')) return;

        const card = createNotFoundCard(name, errorMessage);
        link.insertAdjacentElement('afterend', card);
    });
}

function createProfessorCard(name, data) {
    const card = document.createElement('div');
    card.className = 'rmp-card';
    card.innerHTML = createProfessorCardTemplate(name, data);
    return card;
}

function createNotFoundCard(name, errorMessage) {
    const card = document.createElement('div');
    card.className = 'rmp-card rmp-not-found';
    card.innerHTML = createNotFoundCardTemplate(name, errorMessage);
    return card;
}


(function injectCardStyles() {
    if (document.getElementById('rmp-card-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'rmp-card-styles';
    style.textContent = styles;

    document.head.appendChild(style);
})();


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}        

// Run after page load
window.addEventListener('load', findProfessors);

// Also run immediately in case the page is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findProfessors);
} else {
    findProfessors();
}
    
// Observe dynamically added elements with debouncing
const observer = new MutationObserver(debounce(findProfessors, 250));
observer.observe(document.body, { childList: true, subtree: true });