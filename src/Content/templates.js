export function createProfessorCardTemplate(name, data) {
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
    
    return `
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
}

export function createNotFoundCardTemplate(name, _errorMessage) {
    const normalizedName = (name || '').replace(/\s+/g, ' ').trim();
    const searchUrl = `https://www.ratemyprofessors.com/search/professors/15723?q=${encodeURIComponent(normalizedName)}`;

    return `
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
}