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

// Add visual indicator to the page
function injectProfessorCard(name, data) {
    // Find all professor links with this name
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    
    instructorDivs.forEach((div) => {
        const link = div.querySelector('a');
        if (!link) return;
        
        // Normalize both names for comparison
        const rawLinkName = link.innerText.trim();
        const normalizedLinkName = rawLinkName.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (normalizedLinkName !== name) return;
        
        // Check if card already exists
        if (div.querySelector('.rmp-card')) return;
        
        // Create the card
        const card = createProfessorCard(name, data);
        
        // Insert after the link
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

// Create a modern, compact professor card
function createProfessorCard(name, data) {
    const card = document.createElement('div');
    card.className = 'rmp-card';
    
    const rating = data.avgRating ? parseFloat(data.avgRating) : null;
    const numRatings = data.numRatings || 0;
    const difficulty = data.avgDifficulty ? parseFloat(data.avgDifficulty) : null;
    const department = data.department || 'Unknown Department';
    const professorId = data.legacyId || null;
    
    // Determine colors based on rating
    let ratingColor = '#6b7280';
    let ratingBg = '#f3f4f6';
    if (rating) {
        if (rating >= 4.0) {
            ratingColor = '#10b981';
            ratingBg = '#d1fae5';
        } else if (rating >= 3.0) {
            ratingColor = '#f59e0b';
            ratingBg = '#fef3c7';
        } else if (rating >= 2.0) {
            ratingColor = '#f97316';
            ratingBg = '#fed7aa';
        } else {
            ratingColor = '#ef4444';
            ratingBg = '#fecaca';
        }
    }
    
    // Determine difficulty color
    let difficultyColor = '#6b7280';
    if (difficulty) {
        if (difficulty >= 4.0) {
            difficultyColor = '#ef4444';
        } else if (difficulty >= 3.0) {
            difficultyColor = '#f59e0b';
        } else {
            difficultyColor = '#10b981';
        }
    }
    
    card.innerHTML = `
        <div class="rmp-card-content">
            <div class="rmp-header">
                <div class="rmp-info">
                    <div class="rmp-name">${
                        professorId
                            ? `<a href="https://www.ratemyprofessors.com/professor/${professorId}" target="_blank" rel="noopener noreferrer">${name}</a>`
                            : `${name}`
                    }</div>
                    <div class="rmp-department">${department}</div>
                </div>
                <div class="rmp-rating-badge" style="background-color: ${ratingBg}; color: ${ratingColor};">
                    ${rating ? rating.toFixed(1) : 'N/A'}
                </div>
            </div>
            <div class="rmp-stats">
                <div class="rmp-stat">
                    <span class="rmp-stat-label">Rating</span>
                    <span class="rmp-stat-value" style="color: ${ratingColor};">${rating ? rating.toFixed(1) : 'N/A'}</span>
                    <span class="rmp-stat-detail">${numRatings} reviews</span>
                </div>
                ${difficulty ? `
                <div class="rmp-stat">
                    <span class="rmp-stat-label">Difficulty</span>
                    <span class="rmp-stat-value" style="color: ${difficultyColor};">${difficulty.toFixed(1)}</span>
                    <span class="rmp-stat-detail">${difficulty >= 4.0 ? 'Very Hard' : difficulty >= 3.0 ? 'Hard' : 'Moderate'}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

function createNotFoundCard(name, errorMessage) {
    const card = document.createElement('div');
    card.className = 'rmp-card rmp-not-found';

    // Normalize whitespace in the name and encode for URL
    const normalizedName = (name || '').replace(/\s+/g, ' ').trim();
    const searchUrl = `https://www.ratemyprofessors.com/search/professors/15723?q=${encodeURIComponent(normalizedName)}`;

    card.innerHTML = `
        <div class="rmp-card-content">
            <div class="rmp-header">
                <div class="rmp-info">
                    <div class="rmp-name">${name}</div>
                    <div class="rmp-department">Rate My Professor</div>
                </div>
                <div class="rmp-not-found-badge">
                    ?
                </div>
            </div>
            <div class="rmp-not-found-message">
                <div class="rmp-not-found-text">
                    <div class="rmp-not-found-title">No Data Found</div>
                    <div class="rmp-not-found-subtitle">
                        <a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Search this professor on RateMyProfessor</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Inject CSS styles for the cards
(function injectCardStyles() {
    if (document.getElementById('rmp-card-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'rmp-card-styles';
    style.textContent = `
        .rmp-card {
            margin: 8px 0;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(226, 232, 240, 0.8);
            overflow: hidden;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: rmp-fadeIn 0.3s ease-out;
        }
        
        @keyframes rmp-fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .rmp-card-content {
            padding: 16px;
        }
        
        .rmp-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .rmp-info {
            flex: 1;
        }
        
        .rmp-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 2px;
        }
        
        .rmp-department {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .rmp-rating-badge {
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            min-width: 40px;
            text-align: center;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .rmp-stats {
            display: flex;
            gap: 16px;
        }
        
        .rmp-stat {
            flex: 1;
            text-align: center;
            padding: 8px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .rmp-stat-label {
            display: block;
            font-size: 10px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        
        .rmp-stat-value {
            display: block;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 1px;
        }
        
        .rmp-stat-detail {
            display: block;
            font-size: 10px;
            color: #9ca3af;
            font-weight: 500;
        }
        
        @media (max-width: 480px) {
            .rmp-card {
                max-width: 100%;
            }
            
            .rmp-stats {
                flex-direction: column;
                gap: 8px;
            }
        }

        /* Not Found Card Styles */
        .rmp-not-found {
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .rmp-not-found-badge {
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            min-width: 40px;
            text-align: center;
            background-color: #f3f4f6;
            color: #6b7280;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .rmp-not-found-message {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 8px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .rmp-not-found-icon {
            font-size: 24px;
            opacity: 0.6;
        }
        
        .rmp-not-found-text {
            flex: 1;
        }
        
        .rmp-not-found-title {
            font-size: 14px;
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 2px;
        }
        
        .rmp-not-found-subtitle {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.3;
        }
    `;
    
    document.head.appendChild(style);
})();

// Run after page load
window.addEventListener('load', findProfessors);

// Also run immediately in case the page is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', findProfessors);
} else {
    findProfessors();
}

// Debounce function to prevent too frequent updates
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

// Observe dynamically added elements with debouncing
const observer = new MutationObserver(debounce(findProfessors, 250));
observer.observe(document.body, { childList: true, subtree: true });