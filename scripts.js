// Plant Tracker JavaScript

// Data Arrays
const existingPlants = ['Aloe Vera', 'Basil', 'Cactus', 'Fern', 'Rose', 'Tulip'];
const myPlants = [];

// Modal Resolution Variables
let confirmResolve;
let promptResolve;
let notesResolve;

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Show alert modal
 * @param {string} title - Modal title
 * @param {string} message - Alert message
 * @returns {Promise} - Resolves when modal is closed
 */
function showAlert(title, message) {
    return new Promise((resolve) => {
        document.getElementById('alertModalTitle').textContent = title;
        document.getElementById('alertModalMessage').textContent = message;
        
        const modal = new bootstrap.Modal(document.getElementById('alertModal'));
        modal.show();
        
        // Resolve when modal is hidden
        document.getElementById('alertModal').addEventListener('hidden.bs.modal', resolve, { once: true });
    });
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} - Resolves with true/false
 */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;
        
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    });
}

/**
 * Resolve confirmation modal
 * @param {boolean} result - User's choice
 */
function resolveConfirm(result) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
    modal.hide();
    confirmResolve(result);
}

/**
 * Show prompt modal for text input
 * @param {string} title - Modal title
 * @param {string} message - Prompt message
 * @param {string} defaultValue - Default input value
 * @returns {Promise<string|null>} - Resolves with input value or null
 */
function showPrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        promptResolve = resolve;
        document.getElementById('promptModalTitle').textContent = title;
        document.getElementById('promptModalMessage').textContent = message;
        document.getElementById('promptInput').value = defaultValue;
        
        const modal = new bootstrap.Modal(document.getElementById('promptModal'));
        modal.show();
        
        // Focus input after modal is shown
        document.getElementById('promptModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('promptInput').focus();
            document.getElementById('promptInput').select();
        }, { once: true });
    });
}

/**
 * Resolve prompt modal
 * @param {*} value - Pass anything to get input value, null to cancel
 */
function resolvePrompt(value) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('promptModal'));
    const inputValue = value !== null ? document.getElementById('promptInput').value : null;
    modal.hide();
    promptResolve(inputValue);
}

/**
 * Show notes modal for textarea input
 * @param {string} title - Modal title
 * @param {string} message - Notes message
 * @param {string} defaultValue - Default textarea value
 * @returns {Promise<string|null>} - Resolves with textarea value or null
 */
function showNotes(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        notesResolve = resolve;
        document.getElementById('notesModalTitle').textContent = title;
        document.getElementById('notesModalMessage').textContent = message;
        document.getElementById('notesTextarea').value = defaultValue;
        
        const modal = new bootstrap.Modal(document.getElementById('notesModal'));
        modal.show();
        
        // Focus textarea after modal is shown
        document.getElementById('notesModal').addEventListener('shown.bs.modal', () => {
            document.getElementById('notesTextarea').focus();
        }, { once: true });
    });
}

/**
 * Resolve notes modal
 * @param {*} value - Pass anything to get textarea value, null to cancel
 */
function resolveNotes(value) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('notesModal'));
    const textareaValue = value !== null ? document.getElementById('notesTextarea').value : null;
    modal.hide();
    notesResolve(textareaValue);
}

// ============================================================================
// AUTOCOMPLETE FUNCTIONS
// ============================================================================

/**
 * Show plant name suggestions based on user input
 */
function showSuggestions() {
    const input = document.getElementById('plantName');
    const suggestionBox = document.getElementById('suggestions');
    const query = input.value.toLowerCase();
        
    suggestionBox.innerHTML = '';
        
    if (query === '') {
        suggestionBox.style.display = 'none';
        return;
    }
        
    const filteredPlants = existingPlants.filter(plant => 
        plant.toLowerCase().includes(query)
    );

    if (filteredPlants.length === 0) {
        suggestionBox.style.display = 'none';
    } else {
        suggestionBox.style.display = 'block';
        
        filteredPlants.forEach(plant => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = plant;
            suggestionItem.onclick = () => selectSuggestion(plant);
            suggestionBox.appendChild(suggestionItem);
        });
    }
}

/**
 * Select a suggestion and hide the suggestion box
 * @param {string} plant - Selected plant name
 */
function selectSuggestion(plant) {
    document.getElementById('plantName').value = plant;
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('suggestions').style.display = 'none';
}

// ============================================================================
// PLANT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Add a new plant to the collection
 */
async function addPlant() {
    const plantName = document.getElementById('plantName').value.trim();
    
    // Validation
    if (plantName === '') {
        await showAlert('Error', 'Please enter a plant name!');
        return;
    }

    // Check if plant exists in suggestions
    const plantExists = existingPlants.some(plant => 
        plant.toLowerCase() === plantName.toLowerCase()
    );
    
    if (!plantExists) {
        await showAlert('New Plant', 'This plant is not in our suggestions, but we will add it manually!');
        existingPlants.push(plantName);
    }

    // Create new plant object
    const newPlant = {
        name: plantName,
        lastWatered: 'Never',
        dateAdded: new Date().toLocaleDateString(),
        notes: ''
    };

    // Add to collection
    myPlants.push(newPlant);
    
    // Clear input and hide suggestions
    document.getElementById('plantName').value = '';
    document.getElementById('suggestions').style.display = 'none';
    
    // Update display
    showPlants();
}

/**
 * Mark a plant as watered
 * @param {number} plantIndex - Index of plant in myPlants array
 */
function waterPlant(plantIndex) {
    myPlants[plantIndex].lastWatered = new Date().toLocaleDateString();
    showPlants();
}

/**
 * Delete a plant from the collection
 * @param {number} plantIndex - Index of plant in myPlants array
 */
async function deletePlant(plantIndex) {
    const plantName = myPlants[plantIndex].name;
    const confirmed = await showConfirm(
        'Confirm Delete', 
        `Are you sure you want to delete "${plantName}"?`
    );
    
    if (confirmed) {
        myPlants.splice(plantIndex, 1);
        showPlants();
    }
}

/**
 * Edit a plant's name
 * @param {number} plantIndex - Index of plant in myPlants array
 */
async function editPlant(plantIndex) {
    const currentName = myPlants[plantIndex].name;
    const newName = await showPrompt('Edit Plant', 'Enter new plant name:', currentName);
    
    if (newName !== null && newName.trim() !== '') {
        myPlants[plantIndex].name = newName.trim();
        showPlants();
    }
}

/**
 * Edit a plant's notes
 * @param {number} plantIndex - Index of plant in myPlants array
 */
async function notesPlant(plantIndex) {
    const currentNotes = myPlants[plantIndex].notes || '';
    const plantName = myPlants[plantIndex].name;
    const newNotes = await showNotes(
        `Notes for ${plantName}`, 
        'Enter notes for this plant:', 
        currentNotes
    );
    
    if (newNotes !== null) {
        myPlants[plantIndex].notes = newNotes.trim();
        showPlants();
    }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Display all plants in the plant list
 */
function showPlants() {
    const plantList = document.getElementById('plantList');
    
    // Show empty state if no plants
    if (myPlants.length === 0) {
        plantList.innerHTML = `
            <div class="empty-state">
                <h5>No plants yet!</h5>
                <p>Add your first plant above to get started.</p>
            </div>
        `;
        return;
    }

    // Build HTML for all plants
    let html = '';
    myPlants.forEach((plant, index) => {
        html += `
            <div class="card plant-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="card-title mb-1">${escapeHtml(plant.name)}</h5>
                            <p class="card-text text-muted mb-1">
                                Last watered: ${plant.lastWatered}
                            </p>
                            ${plant.notes ? `
                                <p class="plant-notes mb-0">
                                    Notes: ${escapeHtml(plant.notes)}
                                </p>
                            ` : ''}
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="btn-group" role="group">
                                <button class="btn btn-info btn-sm" 
                                        onclick="waterPlant(${index})" 
                                        title="Water this plant">
                                    💧 Water
                                </button>
                                <button class="btn btn-warning btn-sm" 
                                        onclick="notesPlant(${index})" 
                                        title="Add/edit notes">
                                    📝 Notes
                                </button>
                                <button class="btn btn-secondary btn-sm" 
                                        onclick="editPlant(${index})" 
                                        title="Edit plant name">
                                    ✏️ Edit
                                </button>
                                <button class="btn btn-danger btn-sm" 
                                        onclick="deletePlant(${index})" 
                                        title="Delete this plant">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    plantList.innerHTML = html;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize plant display
    showPlants();
    
    // Add enter key support for plant input
    document.getElementById('plantName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addPlant();
        }
    });

    // Add enter key support for prompt modal
    document.getElementById('promptInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            resolvePrompt();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(event) {
        const input = document.getElementById('plantName');
        const suggestions = document.getElementById('suggestions');
        
        if (!input.contains(event.target) && !suggestions.contains(event.target)) {
            suggestions.style.display = 'none';
        }
    });
});