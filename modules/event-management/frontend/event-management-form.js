const EventManager = {
    data: {
        section1: {},
        section2: [],
        section3: [],
        section4: [],
        section5: {},
        section6: {}
    },

    counters: {
        issues: 0,
        damaged: 0,
        missing: 0
    },

    init() {
        this.showSection(1);
        this.setupDateValidation();
    },

    setupDateValidation() {
        const today = new Date().toISOString().split('T')[0];
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');

        // Optional: set max/min dates if needed
    },

    showSection(num) {
        document.querySelectorAll('.wizard-section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`section-${num}`).classList.remove('hidden');
        window.scrollTo(0, 0);

        if (num === 6) {
            this.renderSummary();
        }
    },

    showMessage(msg, type = 'success') {
        const el = document.getElementById('messageArea');
        el.style.display = 'block';
        el.className = `message alert alert-${type}`;
        el.textContent = msg;

        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    },

    // --- NAVIGATION & VALIDATION ---

    nextSection(targetSection) {
        if (targetSection > 1) {
            const prevSection = targetSection - 1;
            if (!this.validateSection(prevSection)) {
                return;
            }
            this.saveSectionData(prevSection);
        }
        this.showSection(targetSection);
    },

    prevSection(targetSection) {
        this.showSection(targetSection);
    },

    validateSection(num) {
        // Custom validation per section
        if (num === 1) {
            const inputs = document.querySelectorAll('#section-1 .section1-input');
            let isValid = true;
            inputs.forEach(input => {
                if (!input.value.trim() && input.hasAttribute('required')) {
                    input.classList.add('is-invalid');
                    isValid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            if (!isValid) this.showMessage('Please fill in all required fields.', 'danger');
            return isValid;
        }

        if (num === 2) {
            // Validate Issues
            const blocks = document.querySelectorAll('.issue-block');
            let isValid = true;
            blocks.forEach((block) => {
                const problem = block.querySelector('[data-field="problem"]');
                const impact = block.querySelector('[data-field="impact"]');
                if (!problem.value.trim()) { problem.classList.add('is-invalid'); isValid = false; }
                else problem.classList.remove('is-invalid');

                if (!impact.value.trim()) { impact.classList.add('is-invalid'); isValid = false; }
                else impact.classList.remove('is-invalid');
            });
            if (!isValid) this.showMessage('Please describe Problem and Impact for all entries.', 'danger');
            return isValid;
        }

        if (num === 3) {
            // Validate Damaged
            const blocks = document.querySelectorAll('.damaged-block');
            let isValid = true;
            blocks.forEach((block) => {
                const desc = block.querySelector('[data-field="description"]');
                const status = block.querySelector('[data-field="status"]');
                if (!desc.value.trim()) { desc.classList.add('is-invalid'); isValid = false; } else desc.classList.remove('is-invalid');
                if (!status.value) { status.classList.add('is-invalid'); isValid = false; } else status.classList.remove('is-invalid');
            });
            if (!isValid) this.showMessage('Please provide Description and Status for all damaged items.', 'danger');
            return isValid;
        }

        if (num === 4) {
            // Validate Missing
            const blocks = document.querySelectorAll('.missing-block');
            let isValid = true;
            blocks.forEach((block) => {
                const desc = block.querySelector('[data-field="description"]');
                if (!desc.value.trim()) { desc.classList.add('is-invalid'); isValid = false; } else desc.classList.remove('is-invalid');
            });
            if (!isValid) this.showMessage('Please provide Description for all missing items.', 'danger');
            return isValid;
        }

        return true;
    },

    saveSectionData(num) {
        if (num === 1) {
            this.data.section1 = {
                eventName: document.getElementById('eventName').value,
                location: document.getElementById('location').value,
                dateFrom: document.getElementById('dateFrom').value,
                dateTo: document.getElementById('dateTo').value,
                manager: document.getElementById('manager').value,
                summary: document.getElementById('summary').value,
                servicesProvided: document.getElementById('servicesProvided').value
            };
        }
        if (num === 2) {
            this.data.section2 = [];
            document.querySelectorAll('.issue-block').forEach(block => {
                this.data.section2.push({
                    problem: block.querySelector('[data-field="problem"]').value,
                    impact: block.querySelector('[data-field="impact"]').value,
                    solution: block.querySelector('[data-field="solution"]').value,
                    preventive: block.querySelector('[data-field="preventive"]').value,
                    notes: block.querySelector('[data-field="notes"]').value
                });
            });
        }
        if (num === 3) {
            this.data.section3 = [];
            document.querySelectorAll('.damaged-block').forEach(block => {
                this.data.section3.push({
                    code: block.querySelector('[data-field="code"]').value,
                    description: block.querySelector('[data-field="description"]').value,
                    status: block.querySelector('[data-field="status"]').value
                });
            });
        }
        if (num === 4) {
            this.data.section4 = [];
            document.querySelectorAll('.missing-block').forEach(block => {
                this.data.section4.push({
                    code: block.querySelector('[data-field="code"]').value,
                    description: block.querySelector('[data-field="description"]').value
                });
            });
        }
        if (num === 5) {
            this.data.section5 = {
                logistics: document.getElementById('suggLogistics').value,
                operations: document.getElementById('suggOperations').value,
                communication: document.getElementById('suggCommunication').value,
                materials: document.getElementById('suggMaterials').value,
                software: document.getElementById('suggSoftware').value
            };
        }
    },

    // --- DYNAMIC FIELDS ---

    addIssue() {
        this.counters.issues++;
        const id = this.counters.issues;
        const div = document.createElement('div');
        div.className = 'issue-block card mb-3 p-3 bg-light-yellow';
        div.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6>Issue #${id}</h6>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.issue-block').remove()">Remove</button>
      </div>
      <div class="form-group"><label>Problem <span class="required">*</span></label><textarea class="form-control" data-field="problem" required></textarea></div>
      <div class="form-group"><label>Impact <span class="required">*</span></label><textarea class="form-control" data-field="impact" required></textarea></div>
      <div class="form-group"><label>Solution</label><textarea class="form-control" data-field="solution"></textarea></div>
      <div class="form-group"><label>Preventive Actions</label><textarea class="form-control" data-field="preventive"></textarea></div>
      <div class="form-group"><label>Additional Notes</label><textarea class="form-control" data-field="notes"></textarea></div>
    `;
        document.getElementById('issues-container').appendChild(div);
    },

    addDamagedItem() {
        this.counters.damaged++;
        const id = this.counters.damaged;
        const div = document.createElement('div');
        div.className = 'damaged-block card mb-3 p-3 bg-light-blue';
        div.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6>Damaged Item #${id}</h6>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.damaged-block').remove()">Remove</button>
      </div>
      <div class="form-group"><label>Item Code</label><input type="text" class="form-control" data-field="code"></div>
      <div class="form-group"><label>Description <span class="required">*</span></label><textarea class="form-control" data-field="description" required></textarea></div>
      <div class="form-group"><label>Status <span class="required">*</span></label>
        <select class="form-control" data-field="status" required>
          <option value="">Select Status</option>
          <option value="Damaged">Damaged</option>
          <option value="Not Working">Not Working</option>
        </select>
      </div>
    `;
        document.getElementById('damaged-container').appendChild(div);
    },

    addMissingItem() {
        this.counters.missing++;
        const id = this.counters.missing;
        const div = document.createElement('div');
        div.className = 'missing-block card mb-3 p-3 bg-light-red';
        div.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6>Missing Item #${id}</h6>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.missing-block').remove()">Remove</button>
      </div>
      <div class="form-group"><label>Item Code</label><input type="text" class="form-control" data-field="code"></div>
      <div class="form-group"><label>Description <span class="required">*</span></label><textarea class="form-control" data-field="description" required></textarea></div>
    `;
        document.getElementById('missing-container').appendChild(div);
    },

    renderSummary() {
        const s1 = this.data.section1;
        let html = `<ul class="list-group mb-3">
      <li class="list-group-item"><strong>Event:</strong> ${s1.eventName}</li>
      <li class="list-group-item"><strong>Location:</strong> ${s1.location}</li>
      <li class="list-group-item"><strong>Period:</strong> ${s1.dateFrom} to ${s1.dateTo}</li>
      <li class="list-group-item"><strong>Manager:</strong> ${s1.manager}</li>
    </ul>`;

        if (this.data.section2.length > 0) {
            html += `<h5>Issues: ${this.data.section2.length}</h5>`;
        }
        if (this.data.section3.length > 0) {
            html += `<h5>Damaged Items: ${this.data.section3.length}</h5>`;
        }
        if (this.data.section4.length > 0) {
            html += `<h5>Missing Items: ${this.data.section4.length}</h5>`;
        }

        document.getElementById('summary-content').innerHTML = html;
    },

    async submitReport() {
        // Collect final optional field
        this.data.section6 = {
            notes: document.getElementById('finalNotes').value
        };

        // Prepare Payload
        const payload = this.data;

        try {
            const response = await fetch('/api/event-management', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }

            const result = await response.json();

            if (response.ok) {
                this.showMessage('Report submitted successfully!', 'success');
                document.querySelector('#section-6 button.btn-primary').disabled = true;
                // Optional: Redirect or clear form
                setTimeout(() => window.location.reload(), 3000); // Reload after success
            } else {
                this.showMessage(`Error: ${result.error || 'Unknown error'}`, 'danger');
            }
        } catch (err) {
            this.showMessage('Network error occurred.', 'danger');
            console.error(err);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    EventManager.init();
});
