const processedProfessors = new Set();

// Inject CSS styles for the modern card UI
function injectCardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .rmp-card {
            margin: 12px 0;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(226, 232, 240, 0.8);
            overflow: hidden;
            transform: translateY(10px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .rmp-card-visible {
            transform: translateY(0);
            opacity: 1;
        }
        
        .rmp-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .rmp-card-content {
            padding: 20px;
        }
        
        .rmp-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        
        .rmp-professor-info {
            flex: 1;
        }
        
        .rmp-professor-name {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.3;
        }
        
        .rmp-department {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .rmp-rating-badge {
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            min-width: 50px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .rmp-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
        }
        
        .rmp-stat {
            text-align: center;
            padding: 12px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 12px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .rmp-stat-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .rmp-stat-value {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 2px;
            line-height: 1;
        }
        
        .rmp-stat-detail {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 500;
        }
        
        .rmp-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .rmp-source {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .rmp-source-icon {
            font-size: 14px;
        }
        
        .rmp-timestamp {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 500;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .rmp-card {
                margin: 8px 0;
                max-width: 100%;
            }
            
            .rmp-card-content {
                padding: 16px;
            }
            
            .rmp-stats-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .rmp-professor-name {
                font-size: 16px;
            }
        }
        
        /* Animation for loading state */
        .rmp-card-loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(style);
}

// Inject styles when the script loads
injectCardStyles();

// Find professors on the page
function findProfessors() {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    const names = [];
    
    instructorDivs.forEach((div, index) => {
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
            console.log('Data for: ' + name, response);
            
            if (response.success && response.data) {
                // Find the professor's link element to inject the card
                const professorLink = findProfessorLink(name);
                if (professorLink) {
                    injectProfessorCard(professorLink, response.data, name);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

// Find the professor's link element
function findProfessorLink(professorName) {
    const instructorDivs = document.querySelectorAll('div.instructor.class-results-cell');
    for (const div of instructorDivs) {
        const link = div.querySelector('a');
        if (link && link.innerText.trim() === professorName) {
            return link;
        }
    }
    return null;
}

// Inject modern professor card
function injectProfessorCard(linkElement, professorData, professorName) {
    try {
        // Remove any existing card for this professor
        const existingCard = linkElement.parentNode.querySelector('.rmp-card');
        if (existingCard) {
            existingCard.remove();
        }

        // Create the card container
        const card = document.createElement('div');
        card.className = 'rmp-card';
        card.innerHTML = createCardHTML(professorData, professorName);
        
        // Add the card after the link
        linkElement.parentNode.insertBefore(card, linkElement.nextSibling);
        
        // Add entrance animation
        setTimeout(() => {
            card.classList.add('rmp-card-visible');
        }, 100);
        
    } catch (error) {
        console.error('Error injecting professor card:', error);
    }
}

// Create the HTML for the professor card
function createCardHTML(data, name) {
    const rating = data.avgRating ? parseFloat(data.avgRating) : null;
    const numRatings = data.numRatings || 0;
    const difficulty = data.avgDifficulty ? parseFloat(data.avgDifficulty) : null;
    const wouldTakeAgain = data.wouldTakeAgainPercent ? parseFloat(data.wouldTakeAgainPercent) : null;
    const department = data.department || 'Unknown Department';
    
    // Determine rating color
    let ratingColor = '#6b7280'; // gray
    let ratingBg = '#f3f4f6';
    if (rating) {
        if (rating >= 4.0) {
            ratingColor = '#10b981'; // green
            ratingBg = '#d1fae5';
        } else if (rating >= 3.0) {
            ratingColor = '#f59e0b'; // yellow
            ratingBg = '#fef3c7';
        } else if (rating >= 2.0) {
            ratingColor = '#f97316'; // orange
            ratingBg = '#fed7aa';
        } else {
            ratingColor = '#ef4444'; // red
            ratingBg = '#fecaca';
        }
    }
    
    // Determine difficulty color
    let difficultyColor = '#6b7280';
    if (difficulty) {
        if (difficulty >= 4.0) {
            difficultyColor = '#ef4444'; // red
        } else if (difficulty >= 3.0) {
            difficultyColor = '#f59e0b'; // orange
        } else {
            difficultyColor = '#10b981'; // green
        }
    }
    
    return `
        <div class="rmp-card-content">
            <div class="rmp-card-header">
                <div class="rmp-professor-info">
                    <h3 class="rmp-professor-name">${name}</h3>
                    <p class="rmp-department">${department}</p>
                </div>
                <div class="rmp-rating-badge" style="background-color: ${ratingBg}; color: ${ratingColor};">
                    ${rating ? rating.toFixed(1) : 'N/A'}
                </div>
            </div>
            
            <div class="rmp-stats-grid">
                <div class="rmp-stat">
                    <div class="rmp-stat-label">Overall Rating</div>
                    <div class="rmp-stat-value" style="color: ${ratingColor};">
                        ${rating ? `${rating.toFixed(1)}/5.0` : 'N/A'}
                    </div>
                    <div class="rmp-stat-detail">${numRatings} reviews</div>
                </div>
                
                ${difficulty ? `
                <div class="rmp-stat">
                    <div class="rmp-stat-label">Difficulty</div>
                    <div class="rmp-stat-value" style="color: ${difficultyColor};">
                        ${difficulty.toFixed(1)}/5.0
                    </div>
                    <div class="rmp-stat-detail">${difficulty >= 4.0 ? 'Very Hard' : difficulty >= 3.0 ? 'Hard' : difficulty >= 2.0 ? 'Moderate' : 'Easy'}</div>
                </div>
                ` : ''}
                
                ${wouldTakeAgain ? `
                <div class="rmp-stat">
                    <div class="rmp-stat-label">Would Take Again</div>
                    <div class="rmp-stat-value" style="color: ${wouldTakeAgain >= 70 ? '#10b981' : wouldTakeAgain >= 50 ? '#f59e0b' : '#ef4444'};">
                        ${wouldTakeAgain.toFixed(0)}%
                    </div>
                    <div class="rmp-stat-detail">of students</div>
                </div>
                ` : ''}
            </div>
            
            <div class="rmp-card-footer">
                <div class="rmp-source">
                    <span class="rmp-source-icon">📊</span>
                    <span>RateMyProfessors</span>
                </div>
                <div class="rmp-timestamp">
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    `;
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
