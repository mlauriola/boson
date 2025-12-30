// Consultants Management Logic

document.addEventListener('DOMContentLoaded', async () => {
    await initialize();
});

let allSkills = []; // For autocomplete
let currentConsultantSkills = []; // Skills for current form

async function initialize() {
    // Header and Sidebar are auto-initialized by their respective scripts
    // await loadHeader();
    // await loadSidebar();

    // Initial Load
    loadConsultants();
    loadSkills();

    // Event Listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Modal Controls
    const modal = document.getElementById('consultantModal');
    const addBtn = document.getElementById('addConsultantBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');

    addBtn.onclick = () => openModal();
    closeBtn.onclick = () => closeModal();
    cancelBtn.onclick = () => closeModal();

    window.onclick = (event) => {
        if (event.target == modal) closeModal();
        if (event.target == document.getElementById('confirmDeleteModal')) closeConfirmDeleteModal();
    };

    // Form Submit
    document.getElementById('consultantForm').onsubmit = handleFormSubmit;

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filterConsultants(term);
    });

    // Skills Input
    const skillInput = document.getElementById('skillInput');
    skillInput.addEventListener('keydown', handleSkillInputKey);
    skillInput.addEventListener('input', handleSkillInput);
    skillInput.addEventListener('focus', handleSkillInput); // Show all on focus

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#skillsWrapper')) {
            document.getElementById('skillsSuggestions').style.display = 'none';
        }
    });

    // Checkbox Logic
    const selectAllCbx = document.getElementById('selectAll');
    selectAllCbx.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox:not(#selectAll)');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateDeleteButton();
    });

    // Delete Selected
    document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.row-checkbox:checked:not(#selectAll)'))
            .map(cb => cb.dataset.id);

        if (selected.length > 0) {
            confirmDelete(selected);
        }
    });
}

function updateDeleteButton() {
    const selectedCount = document.querySelectorAll('.row-checkbox:checked:not(#selectAll)').length;
    const btn = document.getElementById('deleteSelectedBtn');
    const countSpan = document.getElementById('selectedCount');

    btn.disabled = selectedCount === 0;
    countSpan.innerText = selectedCount;
}

// Data Fetching
async function loadConsultants() {
    try {
        const response = await fetch('/api/event-management/consultants');
        if (!response.ok) throw new Error('Failed to load consultants');
        const consultants = await response.json();
        renderConsultants(consultants);
        window.allConsultants = consultants; // Store for filtering
    } catch (err) {
        console.error(err);
        showNotification('Error loading consultants', 'error');
    }
}

async function loadSkills() {
    try {
        const response = await fetch('/api/event-management/skills');
        if (response.ok) {
            const data = await response.json();
            allSkills = data.map(s => s.Name);
        }
    } catch (err) {
        console.error('Error loading skills', err);
    }
}

// Rendering
function renderConsultants(consultants) {
    const tbody = document.getElementById('consultantsTableBody');
    tbody.innerHTML = '';

    consultants.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" data-id="${c.Id}" onchange="updateDeleteButton()">
            </td>
            <td>${c.LastName} ${c.FirstName}</td>
            <td>${c.Email || '-'}</td>
            <td>${c.Phone || '-'}</td>
            <td>${renderSkillsBadges(c.Skills)}</td>
            <td>
                <button class="btn btn-small btn-edit" onclick="editConsultant(${c.Id})">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    // Reset select all
    document.getElementById('selectAll').checked = false;
    updateDeleteButton();
}

function renderSkillsBadges(skillsStr) {
    if (!skillsStr) return '';
    return skillsStr.split(',').map(s =>
        `<span class="badge badge-info" style="margin-right: 2px;">${s.trim()}</span>`
    ).join('');
}

function filterConsultants(term) {
    const filtered = window.allConsultants.filter(c =>
        (c.FirstName + ' ' + c.LastName).toLowerCase().includes(term) ||
        (c.Email && c.Email.toLowerCase().includes(term)) ||
        (c.Skills && c.Skills.toLowerCase().includes(term))
    );
    renderConsultants(filtered);
}

// Modal Actions
function openModal(consultant = null) {
    currentConsultantSkills = [];
    document.getElementById('skillsSuggestions').style.display = 'none';

    if (consultant) {
        document.getElementById('modalTitle').innerText = 'Edit Consultant';
        document.getElementById('consultantId').value = consultant.Id;
        document.getElementById('firstName').value = consultant.FirstName;
        document.getElementById('lastName').value = consultant.LastName;
        document.getElementById('email').value = consultant.Email || '';
        document.getElementById('phone').value = consultant.Phone || '';
        document.getElementById('notes').value = consultant.Notes || '';

        if (consultant.Skills) {
            currentConsultantSkills = consultant.Skills.split(',').map(s => s.trim());
        }
    } else {
        document.getElementById('modalTitle').innerText = 'Add Consultant';
        document.getElementById('consultantForm').reset();
        document.getElementById('consultantId').value = '';
    }

    renderTags();
    document.getElementById('consultantModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('consultantModal').style.display = 'none';
}

function editConsultant(id) {
    const consultant = window.allConsultants.find(c => c.Id === id);
    if (consultant) openModal(consultant);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Check for pending skill input
    const skillInput = document.getElementById('skillInput');
    if (skillInput && skillInput.value.trim()) {
        addSkill(skillInput.value.trim());
    }

    const id = document.getElementById('consultantId').value;
    const data = {
        id: id ? parseInt(id) : null,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        notes: document.getElementById('notes').value,
        skills: currentConsultantSkills
    };

    try {
        const response = await fetch('/api/event-management/consultants', {
            method: 'POST', // Using POST for both Create and Update as per server logic logic
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to save');

        showNotification('Consultant saved successfully', 'success');
        closeModal();
        loadConsultants();
        loadSkills(); // Reload skills in case new ones were added
    } catch (err) {
        console.error(err);
        showNotification('Failed to save consultant', 'error');
    }
}

// Skills Tag Input Logic
function renderTags() {
    const wrapper = document.getElementById('skillsWrapper');
    // Remove existing tags (but keep input)
    const existingTags = wrapper.querySelectorAll('.tag');
    existingTags.forEach(t => t.remove());

    const input = document.getElementById('skillInput');

    // Insert tags before input
    currentConsultantSkills.forEach(skill => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${skill} <span class="remove-tag" onclick="removeSkill('${skill}')">&times;</span>`;
        wrapper.insertBefore(tag, input);
    });
}

function addSkill(skill) {
    const cleanSkill = skill.trim();
    if (cleanSkill && !currentConsultantSkills.includes(cleanSkill)) {
        currentConsultantSkills.push(cleanSkill);
        renderTags();
    }
    document.getElementById('skillInput').value = '';
    document.getElementById('skillsSuggestions').style.display = 'none';
}

// Expose to global scope
window.updateDeleteButton = updateDeleteButton;
window.removeSkill = function (skill) {
    currentConsultantSkills = currentConsultantSkills.filter(s => s !== skill);
    renderTags();
};

function handleSkillInputKey(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill(e.target.value);
    } else if (e.key === 'Backspace' && e.target.value === '' && currentConsultantSkills.length > 0) {
        // Remove last tag
        currentConsultantSkills.pop();
        renderTags();
    }
}

function handleSkillInput(e) {
    const val = e.target.value.toLowerCase();
    const list = document.getElementById('skillsSuggestions');

    // Filter logic: if val is empty, show all (excluding already selected)
    const matches = allSkills.filter(s =>
        (!val || s.toLowerCase().includes(val)) && !currentConsultantSkills.includes(s)
    );

    if (matches.length > 0) {
        list.innerHTML = matches.map(s => `<li onclick="selectSuggestion('${s}')">${s}</li>`).join('');
        list.style.display = 'block';
    } else {
        list.style.display = 'none';
    }
}

window.selectSuggestion = function (skill) {
    addSkill(skill);
};

// Delete Logic
let deleteIds = [];
function confirmDelete(ids) {
    // ids can be a single ID (number) or array of strings/numbers
    deleteIds = Array.isArray(ids) ? ids : [ids];
    const msg = deleteIds.length === 1
        ? "Are you sure you want to delete this consultant?"
        : `Are you sure you want to delete ${deleteIds.length} consultants?`;

    document.getElementById('confirmDeleteMessage').innerText = msg;
    document.getElementById('confirmDeleteModal').style.display = 'flex';
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
    deleteIds = [];
}

document.getElementById('cancelDeleteBtn').onclick = closeConfirmDeleteModal;
document.getElementById('closeConfirmDeleteModal').onclick = closeConfirmDeleteModal;
document.getElementById('confirmDeleteBtn').onclick = async () => {
    if (deleteIds.length > 0) {
        try {
            // Sequential delete for simplicity in this iteration
            // Ideally backend should support bulk delete
            for (const id of deleteIds) {
                const response = await fetch(`/api/event-management/consultants/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error(`Failed to delete ID ${id}`);
            }

            showNotification('Consultant(s) deleted successfully', 'success');
            loadConsultants();
        } catch (err) {
            console.error(err);
            showNotification('Failed to delete some consultants', 'error');
        }
        closeConfirmDeleteModal();
    }
};

function showNotification(msg, type) {
    // Map 'error' to 'danger' for CSS class compatibility if needed, 
    // or ensure MessageManager handles 'error' class correctly.
    // Assuming 'success' and 'error'/'danger' are valid classes.
    const messageType = type === 'error' ? 'danger' : type;
    if (window.MessageManager) {
        window.MessageManager.show(msg, messageType, 3000); // 3 seconds timeout
    } else {
        alert(msg); // Fallback
    }
}
