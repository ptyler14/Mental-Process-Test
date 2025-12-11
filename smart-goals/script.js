// --- STATE ---
const steps = [
    'step-intro', 'step-draft', 
    'step-s', 'step-m', 'step-a', 'step-r', 'step-t', 
    'step-obstacles', 'step-summary'
];
let currentStepIndex = 0;
let goalData = {};

// --- DOM ---
const get = (id) => document.getElementById(id);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
});

// --- NAVIGATION ---

function nextStep(targetId) {
    // 1. Save data from current step if needed
    saveCurrentStepData();

    // 2. Hide current
    const currentId = steps[currentStepIndex];
    get(currentId).classList.add('hidden');

    // 3. Update Index
    currentStepIndex = steps.indexOf(targetId);

    // 4. Show new
    get(targetId).classList.remove('hidden');
    updateProgress();

    // 5. Special Logic: Update "Draft Display"
    if (targetId.startsWith('step-s') || targetId.startsWith('step-m')) {
        updateDraftReference();
    }
}

function prevStep(targetId) {
    const currentId = steps[currentStepIndex];
    get(currentId).classList.add('hidden');
    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    updateProgress();
}

function updateProgress() {
    const percent = ((currentStepIndex) / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

// --- LOGIC ---

function saveCurrentStepData() {
    // Simple way to capture input from the active step
    const draft = get('draft-input').value;
    if (draft) goalData.draft = draft;
}

function updateDraftReference() {
    // Show the user their original rough draft so they remember what they are refining
    const displays = document.querySelectorAll('.draft-display');
    displays.forEach(el => el.textContent = goalData.draft || "Your goal");
}

function generateGoal() {
    // Capture all inputs
    goalData.s = get('input-s').value;
    goalData.m = get('input-m').value;
    goalData.a = get('input-a').value;
    goalData.r = get('input-r').value;
    goalData.t_date = get('input-t-date').value;
    goalData.t_desc = get('input-t-desc').value;
    
    goalData.obstacle = get('input-obstacle').value;
    goalData.strategy = get('input-strategy').value;
    
    const term = document.querySelector('input[name="term"]:checked').value;
    goalData.term = term;

    // Build the Summary Screen
    buildSummary();
    
    // Navigate
    nextStep('step-summary');
}

function buildSummary() {
    // 1. Header
    get('final-type').textContent = goalData.term === 'long' ? "Long-Term Vision" : "Short-Term Target";
    
    // 2. Construct the Statement
    // "I will [Specific] by [Measuring] because [Relevant]..."
    const statement = `I will ${goalData.s}. I will measure this by ${goalData.m}. This is relevant because ${goalData.r}.`;
    get('final-statement').textContent = statement;

    // 3. Details
    get('final-deadline').textContent = `${goalData.t_desc} (${goalData.t_date})`;
    get('final-obstacle').textContent = goalData.obstacle;
    get('final-strategy').textContent = goalData.strategy;

    // 4. Show Prompt if Long Term
    if (goalData.term === 'long') {
        get('long-term-prompt').classList.remove('hidden');
    } else {
        get('long-term-prompt').classList.add('hidden');
    }
    
    // 5. Save locally
    localStorage.setItem('last_smart_goal', JSON.stringify(goalData));
}
