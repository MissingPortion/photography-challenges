// Global state variables
let progressData = null;
let challengesData = null;
let currentChallenge = null;

// Initialize dashboard when DOM is loaded
async function initializeDashboard() {
    console.log('Starting dashboard initialization...');
    try {
        // Load data from JSON files - MUST be sequential
        const progress = await loadProgressData();
        const challenges = await loadChallengesData();
        
        // Verify data loaded correctly
        if (!progressData || !challengesData || !currentChallenge) {
            throw new Error('Failed to load required data');
        }
        
        console.log('Data loaded successfully:', {
            progressData: !!progressData,
            challengesData: !!challengesData,
            currentChallenge: !!currentChallenge
        });
        
        // Update UI based on current state
        updateDashboardState();
        updateProgressIndicators();
        loadBingoCard();
        loadCompletedChallenges();
        
        console.log('Dashboard initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to load challenge data');
        return false;
    }
}

// Load progress data from JSON
async function loadProgressData() {
    try {
        const response = await fetch('progress.json');
        if (!response.ok) throw new Error('Failed to load progress data');
        
        const data = await response.json();
        progressData = data;
        
        console.log('Progress data loaded:', progressData);
        return progressData;
    } catch (error) {
        console.error('Error loading progress data:', error);
        throw error;
    }
}

// Load challenges data from JSON
async function loadChallengesData() {
    try {
        const response = await fetch('challenges.json');
        if (!response.ok) throw new Error('Failed to load challenges data');
        
        const data = await response.json();
        challengesData = data;
        
        // Get current challenge - ONLY after progressData is loaded
        if (progressData && progressData.current_challenge_id) {
            currentChallenge = challengesData.challenges[progressData.current_challenge_id];
            console.log('Current challenge set:', currentChallenge);
        } else {
            throw new Error('No current challenge ID in progress data');
        }
        
        return challengesData;
    } catch (error) {
        console.error('Error loading challenges data:', error);
        throw error;
    }
}

// Update dashboard state based on progress data
function updateDashboardState() {
    console.log('Updating dashboard state...');
    
    if (!progressData || !currentChallenge) {
        console.error('Missing data for dashboard update');
        return;
    }
    
    // Hide all modes first
    document.querySelectorAll('.status-mode').forEach(mode => {
        mode.classList.add('hidden');
    });
    
    console.log('Challenge state:', {
        completed: progressData.challenge_completed,
        revealed: progressData.challenge_revealed
    });
    
    if (progressData.challenge_completed) {
        // Show completion mode
        showCompletionMode();
    } else if (progressData.challenge_revealed) {
        // Show challenge mode
        showChallengeMode();
    } else {
        // Show location mode
        showLocationMode();
    }
}

// Show location-only mode
function showLocationMode() {
    const locationMode = document.getElementById('location-mode');
    const locationName = document.getElementById('location-name');
    
    if (!locationMode || !locationName) {
        console.error('Location mode elements not found');
        return;
    }
    
    locationMode.classList.remove('hidden');
    locationName.textContent = currentChallenge.location;
}

// Show challenge revealed mode
function showChallengeMode() {
    const challengeMode = document.getElementById('challenge-mode');
    const challengeTitle = document.getElementById('challenge-title');
    const challengeOptions = document.getElementById('challenge-options');
    
    if (!challengeMode || !challengeTitle || !challengeOptions) {
        console.error('Challenge mode elements not found');
        return;
    }
    
    challengeMode.classList.remove('hidden');
    challengeTitle.textContent = currentChallenge.title;
    
    // Clear and rebuild challenge options
    challengeOptions.innerHTML = '';
    
    if (currentChallenge.options && currentChallenge.options.length > 0) {
        currentChallenge.options.forEach((option, index) => {
            const optionElement = createChallengeOption(option, index);
            challengeOptions.appendChild(optionElement);
        });
    } else {
        console.error('No challenge options found');
    }
}

// Create challenge option element
function createChallengeOption(option, index) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'challenge-option';
    optionDiv.dataset.optionId = option.id;
    
    optionDiv.innerHTML = `
        <h4 class="option-title">${option.title}</h4>
        <p class="option-description">${option.description}</p>
        <div class="option-meta">
            <span class="option-duration">${option.duration}</span>
            <span class="option-difficulty">${option.difficulty}</span>
        </div>
    `;
    
    // Add click handler for option selection
    optionDiv.addEventListener('click', () => selectChallengeOption(option, optionDiv));
    
    return optionDiv;
}

// Handle challenge option selection
function selectChallengeOption(option, element) {
    // Remove previous selections
    document.querySelectorAll('.challenge-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Mark this option as selected
    element.classList.add('selected');
    
    // Store selected option
    window.selectedChallengeOption = option;
    
    console.log('Selected challenge option:', option.title);
}

// Show completion mode
function showCompletionMode() {
    const completionMode = document.getElementById('completion-mode');
    const completionTitle = document.getElementById('completion-title');
    const completedCount = document.getElementById('completed-count');
    const remainingCount = document.getElementById('remaining-count');
    
    if (!completionMode || !completionTitle || !completedCount || !remainingCount) {
        console.error('Completion mode elements not found');
        return;
    }
    
    completionMode.classList.remove('hidden');
    completionTitle.textContent = `${currentChallenge.location}: Complete`;
    completedCount.textContent = progressData.completed_count;
    remainingCount.textContent = progressData.total_challenges - progressData.completed_count;
}

// Update progress indicators
function updateProgressIndicators() {
    if (!progressData) {
        console.error('No progress data for indicators');
        return;
    }
    
    // Update header progress
    const currentProgress = document.getElementById('current-progress');
    if (currentProgress) {
        currentProgress.textContent = `${progressData.completed_count}/${progressData.total_challenges}`;
    }
    
    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        const percentage = (progressData.completed_count / progressData.total_challenges) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    // Update landing page progress if elements exist
    const progressCount = document.getElementById('progress-count');
    const progressCircle = document.getElementById('progress-circle');
    
    if (progressCount) {
        progressCount.textContent = `${progressData.completed_count}/${progressData.total_challenges}`;
    }
    
    if (progressCircle) {
        const circumference = 2 * Math.PI * 25;
        const progress = (progressData.completed_count / progressData.total_challenges) * circumference;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference - progress;
    }
}

// Load Style Bingo Card
function loadBingoCard() {
    if (!progressData || !progressData.style_bingo) {
        console.error('No bingo data available');
        return;
    }
    
    const bingoCard = document.getElementById('bingo-card');
    if (!bingoCard) {
        console.error('Bingo card element not found');
        return;
    }
    
    // Clear existing content
    bingoCard.innerHTML = '';
    
    const grid = progressData.style_bingo.grid;
    const completedStyles = progressData.style_bingo.completed_styles || [];
    const styleTypes = progressData.style_bingo.style_types;
    
    // Create 5x5 grid
    grid.forEach((row, rowIndex) => {
        row.forEach((style, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.textContent = style;
            cell.dataset.style = style;
            cell.dataset.type = styleTypes[style] || 'UNKNOWN';
            
            // Mark completed styles
            if (completedStyles.includes(style)) {
                cell.classList.add('completed');
            }
            
            // Mark free space
            if (style === 'FREE SPACE') {
                cell.classList.add('free-space');
                cell.classList.add('completed'); // Free space is always completed
            }
            
            // Add click handler for style selection
            cell.addEventListener('click', () => selectBingoStyle(style, cell));
            
            bingoCard.appendChild(cell);
        });
    });
    
    console.log('Bingo card populated with', grid.length * grid[0].length, 'cells');
}

// Handle bingo style selection
function selectBingoStyle(style, cellElement) {
    if (cellElement.classList.contains('completed')) {
        console.log('Style already completed:', style);
        return;
    }
    
    // Remove previous selections
    document.querySelectorAll('.bingo-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Select this style
    cellElement.classList.add('selected');
    window.selectedBingoStyle = style;
    
    console.log('Selected bingo style:', style);
    
    // Show style info
    showStyleInfo(style, cellElement.dataset.type);
}

// Show information about selected style
function showStyleInfo(style, type) {
    // Create or update style info tooltip
    let tooltip = document.querySelector('.style-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'style-tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h4>${style}</h4>
            <p>Type: ${type}</p>
            <small>Click to select for your next challenge</small>
        </div>
    `;
    
    // Position tooltip (basic positioning)
    tooltip.style.display = 'block';
    setTimeout(() => {
        tooltip.style.display = 'none';
    }, 3000);
}

// Load completed challenges
function loadCompletedChallenges() {
    if (!progressData || !challengesData) {
        console.error('No data for completed challenges');
        return;
    }
    
    const completedContainer = document.getElementById('completed-challenges');
    if (!completedContainer) {
        console.error('Completed challenges container not found');
        return;
    }
    
    // Clear existing content
    completedContainer.innerHTML = '';
    
    if (progressData.completed_challenges.length === 0) {
        completedContainer.innerHTML = '<p class="no-challenges">No challenges completed yet. Start your first adventure!</p>';
        return;
    }
    
    // Create cards for completed challenges
    progressData.completed_challenges.forEach(challengeId => {
        const challenge = challengesData.challenges[challengeId];
        if (challenge) {
            const challengeCard = createCompletedChallengeCard(challenge);
            completedContainer.appendChild(challengeCard);
        }
    });
}

// Create completed challenge card
function createCompletedChallengeCard(challenge) {
    const card = document.createElement('div');
    card.className = 'completed-challenge';
    
    // Get a fun emoji for the challenge
    const emoji = getChallengeEmoji(challenge.id);
    
    card.innerHTML = `
        <div class="challenge-thumbnail">${emoji}</div>
        <div class="challenge-name">${challenge.location}</div>
        <div class="challenge-date">Completed</div>
    `;
    
    return card;
}

// Get emoji for challenge type
function getChallengeEmoji(challengeId) {
    const emojiMap = {
        'pizzaguy': '🍕',
        'district24': '🌃',
        'social_ghana': '🎉',
        'kokrobite': '🏖️',
        'ethiopian_restaurant': '🇪🇹',
        'good_baker': '🍰',
        'pinocchio': '🍦',
        'el_wak_stadium': '⚽',
        'skatepark': '🛹',
        'libya_street': '🏠',
        'afotey_street': '💕',
        'sowutuom': '🌳',
        'bbnz_live': '🎵',
        'bantama': '🍛',
        'the_place': '☕',
        'ubers_bolts': '🚗',
        'frimps_roundabout': '🚦'
    };
    
    return emojiMap[challengeId] || '📸';
}

// Button action handlers
function startChallenge() {
    if (!window.selectedChallengeOption) {
        alert('Please select a challenge option first!');
        return;
    }
    
    if (!window.selectedBingoStyle) {
        alert('Please select a style from the bingo card!');
        return;
    }
    
    // Show selected options
    const message = `Challenge: ${window.selectedChallengeOption.title}\nStyle: ${window.selectedBingoStyle}\n\nReady to create something awesome?`;
    
    if (confirm(message)) {
        console.log('Starting challenge with:', {
            option: window.selectedChallengeOption,
            style: window.selectedBingoStyle
        });
        
        // In real implementation, this would track the start time
        alert('Challenge started! Create your content and upload when ready.');
    }
}

function uploadWork() {
    if (!challengesData) return;
    
    // Open Google Drive folder
    const driveUrl = challengesData.drive_folder_url || 'https://drive.google.com/drive/folders/YOUR_SHARED_FOLDER_ID';
    window.open(driveUrl, '_blank');
    
    console.log('Opening upload folder');
}

// Simulate finding the gift (for testing)
function markFound() {
    if (progressData) {
        progressData.challenge_revealed = true;
        updateDashboardState();
        console.log('Gift found! Challenge unlocked.');
    }
}

// Simulate challenge completion (for testing)
function markChallengeComplete() {
    if (!progressData || !currentChallenge) return;
    
    // Mark current challenge as completed
    progressData.challenge_completed = true;
    progressData.completed_count += 1;
    progressData.completed_challenges.push(progressData.current_challenge_id);
    
    // Mark selected style as completed
    if (window.selectedBingoStyle && !progressData.style_bingo.completed_styles.includes(window.selectedBingoStyle)) {
        progressData.style_bingo.completed_styles.push(window.selectedBingoStyle);
    }
    
    // Update UI
    updateDashboardState();
    updateProgressIndicators();
    loadBingoCard();
    loadCompletedChallenges();
    
    console.log('Challenge marked as complete');
}

// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background: #ff4757;
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        z-index: 9999;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility function to simulate admin actions (for testing)
function adminRevealChallenge() {
    if (progressData) {
        progressData.challenge_revealed = true;
        updateDashboardState();
        console.log('Challenge revealed by admin');
    }
}

// Add some CSS for the tooltip
const tooltipStyles = document.createElement('style');
tooltipStyles.textContent = `
.style-tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    z-index: 9999;
    display: none;
}

.tooltip-content h4 {
    margin: 0 0 0.5rem 0;
    color: #ffd700;
}

.tooltip-content p {
    margin: 0 0 0.5rem 0;
}

.tooltip-content small {
    opacity: 0.8;
}

.no-challenges {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 2rem;
}

.error-message {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-1rem);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

.bingo-cell.selected {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-color: #667eea;
    transform: scale(1.05);
}

.option-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.8rem;
}

.option-duration {
    color: #667eea;
    font-weight: 500;
}

.option-difficulty {
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    color: #666;
}
`;

document.head.appendChild(tooltipStyles);

// Make functions available globally for HTML onclick handlers
window.initializeDashboard = initializeDashboard;
window.loadBingoCard = loadBingoCard;
window.updateProgress = updateProgressIndicators;
window.startChallenge = startChallenge;
window.uploadWork = uploadWork;
window.adminRevealChallenge = adminRevealChallenge;
window.markChallengeComplete = markChallengeComplete;
window.markFound = markFound;

// Add manual initialization function for testing
window.manualInit = async function() {
    console.log('=== MANUAL INITIALIZATION ===');
    try {
        const success = await initializeDashboard();
        if (success) {
            console.log('Manual initialization complete');
            console.log('Final state check:');
            console.log('- progressData:', progressData);
            console.log('- challengesData:', challengesData);
            console.log('- currentChallenge:', currentChallenge);
        }
    } catch (error) {
        console.error('Manual initialization failed:', error);
    }
};