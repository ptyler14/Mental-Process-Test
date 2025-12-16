/* script.js
   Logic for the Goal Architect Wizard (index.html)
*/

// 1. Define the Step Order (Matches the IDs in your HTML)
const steps = [
    'view-initial',        // Step 1: Start
    'view-smart-breakdown',// Step 2: Refine (S.M.A.R.T.)
    'view-rewrite',        // Step 3: Rewrite Statement
    'view-breakdown',      // Step 4: Make it Real (Action)
    'view-obstacles',      // Step 5: Obstacles
    'view-resources',      // Step 6: Confidence
    'view-review'          // Step 7: Final Review
];

let currentStepIndex = 0;

// 2. Initialize Date Picker
document.addEventListener('DOMContentLoaded', () => {
    flatpickr("#action-datetime", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today"
    });

    // Update the "Confidence" slider display number
    const rangeInput = document.getElementById('inp-conf-1');
    const rangeValue = document.getElementById('val-conf-1');
    if(rangeInput) {
        rangeInput.addEventListener('input', (e) => {
            rangeValue.textContent = e.target.value;
        });
    }
});

// 3. Navigation Functions
function nextStep(currentId) {
    // A. Validation (Optional: Prevent moving if empty)
    // if(!validateStep(currentId)) return; 

    // B. Find current index
    const index = steps.indexOf(currentId);
    if (index >= 0 && index < steps.length - 1) {
        // Hide current
        document.getElementById(steps[index]).classList.add('hidden');
        // Show next
        document.getElementById(steps[index + 1]).classList.remove('hidden');
        
        // Special Logic: If moving to "Rewrite", fill the review text
        if (steps[index + 1] === 'view-rewrite') {
            populateSmartReview();
        }
    }
}

function prevStep(prevId) {
    // Hide current (which is actually the one visible now)
    // We can find the currently visible step by checking the 'steps' array
    const visibleStep = steps.find(id => !document.getElementById(id).classList.contains('hidden'));
    
    if (visibleStep) {
        document.getElementById(visibleStep).classList.add('hidden');
        document.getElementById(prevId).classList.remove('hidden');
    }
}

// 4. Data Handling Helper (Fill the "Rewrite" page)
function populateSmartReview() {
    document.getElementById('ref-s').innerText = document.getElementById('inp-s').value || '...';
    document.getElementById('ref-m').innerText = document.getElementById('inp-m').value || '...';
    document.getElementById('ref-t').innerText = document.getElementById('inp-t').value || '...';
    
    // Also update the "your goal" span on the breakdown page if user goes back
    const initialGoal = document.getElementById('inp-initial').value;
    const refSpans = document.querySelectorAll('.ref-goal');
    refSpans.forEach(span => span.innerText = initialGoal || 'your goal');
}

// 5. Final Review Generation
function generateReview() {
    // Gather all data
    const finalSmart = document.getElementById('inp-smart-final').value || document.getElementById('inp-initial').value;
    const actionStep = document.getElementById('inp-this-week').value;
    const obstacle = document.getElementById('inp-obstacles').value;
    const response = document.getElementById('inp-responses').value;

    // Display on Review Page
    document.getElementById('out-smart-final').innerText = finalSmart;
    document.getElementById('out-this-week').innerText = actionStep || "No immediate action set.";
    document.getElementById('out-obstacles').innerText = obstacle || "None anticipated.";
    document.getElementById('out-responses').innerText = response || "N/A";

    // Move to Review View
    nextStep('view-resources'); 
}

// 6. Save Logic (Triggered by the final "Save" button)
// Note: The button in HTML actually calls window.location.href, 
// so we need to intercept that or change the button to call saveGoal() first.
// Let's attach this to the window so it runs before leaving.

function saveGoal() {
    // 1. Create Goal Object
    const goal = {
        id: Date.now().toString(), // Unique ID
        createdAt: new Date().toISOString(),
        initialGoal: document.getElementById('inp-initial').value,
        
        // SMART Breakdown
        specific: document.getElementById('inp-s').value,
        measurable: document.getElementById('inp-m').value,
        achievable: document.getElementById('inp-a').value,
        relevant: document.getElementById('inp-r').value,
        timeBound: document.getElementById('inp-t').value,
        
        // Final Statement
        finalSmart: document.getElementById('inp-smart-final').value,
        
        // Action Plan
        nextAction: document.getElementById('inp-this-week').value,
        actionDate: document.getElementById('action-datetime').value,
        
        // Obstacles
        obstacle: document.getElementById('inp-obstacles').value,
        strategy: document.getElementById('inp-responses').value,
        
        // Category (Simple logic: keyword match or default)
        category: determineCategory(document.getElementById('inp-initial').value),
        
        archived: false,
        actionCompleted: false
    };

    // 2. Save to LocalStorage
    const db = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    db.push(goal);
    localStorage.setItem('user_goals_db', JSON.stringify(db));

    // 3. Redirect (Handled by the button, but we can do it here too)
    window.location.href = 'dashboard.html';
}

// Helper: Auto-categorize based on keywords (Optional)
function determineCategory(text) {
    text = text.toLowerCase();
    if (text.includes('run') || text.includes('weight') || text.includes('health') || text.includes('gym')) return 'Health';
    if (text.includes('save') || text.includes('money') || text.includes('job') || text.includes('promotion')) return 'Wealth';
    if (text.includes('date') || text.includes('wife') || text.includes('husband') || text.includes('friend')) return 'Relationships';
    return 'Wisdom'; // Default
}

// IMPORTANT: Overwrite the button onclick in HTML for the final save
// You can either change HTML to onclick="saveGoal()" OR run this:
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.querySelector('#view-review .btn-primary');
    if(saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault(); // Stop immediate link
            saveGoal();
        };
    }
});
