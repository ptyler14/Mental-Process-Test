/* script.js */

// 1. Define the Step Order
const steps = [
    'view-initial',        // Step 1: Start
    'view-smart-breakdown',// Step 2: Refine (S.M.A.R.T.)
    'view-rewrite',        // Step 3: Rewrite Statement
    'view-breakdown',      // Step 4: Make it Real (Action)
    'view-obstacles',      // Step 5: Obstacles
    'view-resources',      // Step 6: Confidence
    'view-review'          // Step 7: Final Review
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Date Picker
    if(document.getElementById("action-datetime")) {
        flatpickr("#action-datetime", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            minDate: "today"
        });
    }

    // Initialize Slider
    const rangeInput = document.getElementById('inp-conf-1');
    const rangeValue = document.getElementById('val-conf-1');
    if(rangeInput) {
        rangeInput.addEventListener('input', (e) => {
            rangeValue.textContent = e.target.value;
        });
    }

    // Ensure the final save button calls the save function
    const saveBtn = document.querySelector('#view-review .btn-primary');
    if(saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault(); 
            saveGoal();
        };
    }
});

// --- NAVIGATION FUNCTIONS ---

function nextStep(targetId) {
    // 1. Find the currently visible step
    const currentStepId = steps.find(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    });
    
    // 2. Hide Current
    if (currentStepId) {
        document.getElementById(currentStepId).classList.add('hidden');
    }
    
    // 3. Show Target
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        targetEl.classList.remove('hidden');
    }
    
    // 4. Special Triggers
    if (targetId === 'view-rewrite') {
        populateSmartReview();
    }
}

function prevStep(targetId) {
    // Works the same way: Find current, hide it, show target
    nextStep(targetId); 
}

// --- DATA HANDLING ---

function populateSmartReview() {
    document.getElementById('ref-s').innerText = document.getElementById('inp-s').value || '...';
    document.getElementById('ref-m').innerText = document.getElementById('inp-m').value || '...';
    document.getElementById('ref-t').innerText = document.getElementById('inp-t').value || '...';
    
    const initialGoal = document.getElementById('inp-initial').value;
    const refSpans = document.querySelectorAll('.ref-goal');
    refSpans.forEach(span => span.innerText = initialGoal || 'your goal');
}

function generateReview() {
    const finalSmart = document.getElementById('inp-smart-final').value || document.getElementById('inp-initial').value;
    const actionStep = document.getElementById('inp-this-week').value;
    const obstacle = document.getElementById('inp-obstacles').value;
    const response = document.getElementById('inp-responses').value;

    document.getElementById('out-smart-final').innerText = finalSmart;
    document.getElementById('out-this-week').innerText = actionStep || "No immediate action set.";
    document.getElementById('out-obstacles').innerText = obstacle || "None anticipated.";
    document.getElementById('out-responses').innerText = response || "N/A";

    nextStep('view-review'); 
}

function saveGoal() {
    // 1. Collect Data
    const goal = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        initialGoal: document.getElementById('inp-initial').value,
        
        // SMART Data
        specific: document.getElementById('inp-s').value,
        measurable: document.getElementById('inp-m').value,
        achievable: document.getElementById('inp-a').value,
        relevant: document.getElementById('inp-r').value,
        timeBound: document.getElementById('inp-t').value,
        
        finalSmart: document.getElementById('inp-smart-final').value,
        
        // We now initialize the tasks array with the first step
        tasks: [],
        
        obstacle: document.getElementById('inp-obstacles').value,
        strategy: document.getElementById('inp-responses').value,
        
        category: determineCategory(document.getElementById('inp-initial').value),
        archived: false
    };

    // Add the first action as a task if it exists
    const firstAction = document.getElementById('inp-this-week').value;
    if(firstAction) {
        goal.tasks.push({
            id: Date.now() + 1,
            text: firstAction,
            date: document.getElementById('action-datetime').value,
            completed: false
        });
    }
    // Also save legacy field for safety
    goal.nextAction = firstAction;
    goal.actionDate = document.getElementById('action-datetime').value;

    // 2. Save
    const db = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    db.push(goal);
    localStorage.setItem('user_goals_db', JSON.stringify(db));

    // 3. Exit
    window.location.href = 'dashboard.html';
}

function determineCategory(text) {
    if(!text) return 'Happiness';
    text = text.toLowerCase();
    if (text.includes('run') || text.includes('weight') || text.includes('health') || text.includes('gym')) return 'Health';
    if (text.includes('save') || text.includes('money') || text.includes('job') || text.includes('promotion')) return 'Wealth';
    if (text.includes('date') || text.includes('wife') || text.includes('husband') || text.includes('friend')) return 'Relationships';
    return 'Happiness'; 
}
