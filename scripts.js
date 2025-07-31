// Plant Tracker JavaScript

// Data Arrays
const existingPlants = ['Aloe Vera', 'Basil', 'Cactus', 'Fern', 'Rose', 'Tulip'];
const myPlants = [];

// Modal Resolution Variables
let confirmResolve;
let promptResolve;
let notesResolve;

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

function savePlants() {
    localStorage.setItem('myPlants', JSON.stringify(myPlants));
}

function loadPlants() {
    const stored = localStorage.getItem('myPlants');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            myPlants.push(...parsed);
        } catch (e) {
            console.error('Error parsing saved plants:', e);
        }
    }
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

function showAlert(title, message) {
    return new Promise((resolve) => {
        document.getElementById('alertModalTitle').textContent = title;
        document.getElementById('alertModalMessage').textContent = message;

        const modalEl = document.getElementById('alertModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener('hidden.bs.modal', resolve, { once: true });
    });
}

function showConfirm(title, message) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalMessage').textContent = message;

        const modalEl = document.getElementById('confirmModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
    });
}

function resolveConfirm(result) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
    modal.hide();
    confirmResolve(result);
}

function showPrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        promptResolve = resolve;
        document.getElementById('promptModalTitle').textContent = title;
        document.getElementById('promptModalMessage').textContent = message;
        document.getElementById('promptInput').value = defaultValue;

        const modalEl = document.getElementById('promptModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener('shown.bs.modal', () => {
            const input = document.getElementById('promptInput');
            input.focus();
            input.select();
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => resolve(null), { once: true });
    });
}

function resolvePrompt() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('promptModal'));
    const inputValue = document.getElementById('promptInput').value;
    modal.hide();
    promptResolve(inputValue);
}

function showNotes(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        notesResolve = resolve;
        document.getElementById('notesModalTitle').textContent = title;
        document.getElementById('notesModalMessage').textContent = message;
        document.getElementById('notesTextarea').value = defaultValue;

        const modalEl = document.getElementById('notesModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        modalEl.addEventListener('shown.bs.modal', () => {
            document.getElementById('notesTextarea').focus();
        }, { once: true });

        modalEl.addEventListener('hidden.bs.modal', () => resolve(null), { once: true });
    });
}

function resolveNotes() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('notesModal'));
    const textareaValue = document.getElementById('notesTextarea').value;
    modal.hide();
    notesResolve(textareaValue);
}

// ============================================================================
// AUTOCOMPLETE FUNCTIONS
// ============================================================================

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

function selectSuggestion(plant) {
    document.getElementById('plantName').value = plant;
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('suggestions').style.display = 'none';
}

// ============================================================================
// PLANT MANAGEMENT FUNCTIONS
// ============================================================================

async function addPlant() {
    const plantName = document.getElementById('plantName').value.trim();

    if (plantName === '') {
        await showAlert('Error', 'Please enter a plant name!');
        return;
    }

    const alreadyAdded = myPlants.some(p => p.name.toLowerCase() === plantName.toLowerCase());
    if (alreadyAdded) {
        await showAlert('Duplicate Plant', `"${plantName}" is already in your collection.`);
        return;
    }

    const plantExists = existingPlants.some(plant =>
        plant.toLowerCase() === plantName.toLowerCase()
    );

    if (!plantExists) {
        await showAlert('New Plant', 'This plant is not in our suggestions, but we will add it manually!');
        existingPlants.push(plantName);
    }

    const newPlant = {
        name: plantName,
        lastWatered: 'Never',
        dateAdded: new Date().toLocaleDateString(),
        notes: ''
    };

    myPlants.push(newPlant);
    savePlants();

    document.getElementById('plantName').value = '';
    document.getElementById('suggestions').style.display = 'none';

    showPlants();
}

function waterPlant(plantIndex) {
    myPlants[plantIndex].lastWatered = new Date().toLocaleDateString();
    savePlants();
    showPlants();
}

async function deletePlant(plantIndex) {
    const confirmed = await showConfirm('Confirm Delete', `Delete "${myPlants[plantIndex].name}"?`);
    if (confirmed) {
        myPlants.splice(plantIndex, 1);
        savePlants();
        showPlants();
    }
}

async function editPlant(plantIndex) {
    const currentName = myPlants[plantIndex].name;
    const newName = await showPrompt('Edit Plant', 'Enter new plant name:', currentName);
    if (newName !== null && newName.trim() !== '') {
        myPlants[plantIndex].name = newName.trim();
        savePlants();
        showPlants();
    }
}

async function notesPlant(plantIndex) {
    const currentNotes = myPlants[plantIndex].notes || '';
    const plantName = myPlants[plantIndex].name;
    const newNotes = await showNotes(`Notes for ${plantName}`, 'Enter notes for this plant:', currentNotes);

    if (newNotes !== null) {
        myPlants[plantIndex].notes = newNotes.trim();
        savePlants();
        showPlants();
    }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function showPlants() {
    const plantList = document.getElementById('plantList');

    if (myPlants.length === 0) {
        plantList.innerHTML = `
            <div class="empty-state">
                <h5>No plants yet!</h5>
                <p>Add your first plant above to get started.</p>
            </div>
        `;
        return;
    }

    let html = '';
    myPlants.forEach((plant, index) => {
        const wateredToday = plant.lastWatered === new Date().toLocaleDateString();
        html += `
            <div class="card plant-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="card-title mb-1">${escapeHtml(plant.name)}</h5>
                            <p class="card-text text-muted mb-1">
                                Last watered: ${plant.lastWatered}
                                ${wateredToday ? '<span class="text-success"> (Today 🌿)</span>' : ''}
                            </p>
                            ${plant.notes ? `<p class="plant-notes mb-0">Notes: ${escapeHtml(plant.notes)}</p>` : ''}
                        </div>
                        <div class="col-md-6 text-md-end">
                            <div class="btn-group" role="group">
                                <button class="btn btn-info btn-sm" onclick="waterPlant(${index})" title="Water this plant">💧 Water</button>
                                <button class="btn btn-warning btn-sm" onclick="notesPlant(${index})" title="Add/edit notes">📝 Notes</button>
                                <button class="btn btn-secondary btn-sm" onclick="editPlant(${index})" title="Edit plant name">✏️ Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deletePlant(${index})" title="Delete this plant">🗑️ Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    plantList.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    loadPlants();
    showPlants();

    document.getElementById('plantName').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addPlant();
        }
    });

    document.getElementById('promptInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            resolvePrompt();
        }
    });

    document.addEventListener('click', function (event) {
        const input = document.getElementById('plantName');
        const suggestions = document.getElementById('suggestions');

        if (!input.contains(event.target) && !suggestions.contains(event.target)) {
            suggestions.style.display = 'none';
        }
    });
});
