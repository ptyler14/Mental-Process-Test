// --- STATE ---
const steps = [
    'view-education', 'view-initial', 'view-smart-breakdown', 'view-rewrite',
    'view-breakdown', 'view-obstacles', 'view-resources', 'view-review'
];
let currentStepIndex = 0;

// --- DOM ---
const get = (id) => document.getElementById(id);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Slider Listeners
    get('inp-conf-1').addEventListener('input', (e) => get('val-conf-1').textContent = e.target.value);
    get('inp-conf-2').addEventListener('input', (e) => get('val-conf-2').textContent = e.target.value);
});

// --- NAVIGATION ---
function startExercise() {
    get('progress-container').classList.remove('hidden');
    nextStep('view-initial');
}

function nextStep(targetId) {
    const currentId = steps[currentStepIndex];
    if (currentId) get(currentId).classList.add('hidden');

    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    
    // Updates
    updateProgress();
    updateReferences();
}

function prevStep(targetId) {
    const currentId = steps[currentStepIndex];
    if (currentId) get(currentId).classList.add('hidden');

    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    updateProgress();
}

function updateProgress() {
    // Education doesn't count for progress bar
    const percent = (currentStepIndex / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

function updateReferences() {
    // Update "My Goal" reference text on future pages
    const goal = get('inp-initial').value;
    const refs = document.querySelectorAll('.ref-goal');
    refs.forEach(el => el.textContent = goal || "your goal");

    // Update S, M, T previews on Rewrite page
    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- REVIEW GENERATION ---
function generateReview() {
    // Output all data to the final summary card
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    get('out-conf-1').textContent = get('inp-conf-1').value;
    get('out-conf-2').textContent = get('inp-conf-2').value;

    // Optional: Save to local storage
    const data = {
        initial: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        thisWeek: get('inp-this-week').value,
        date: new Date().toISOString()
    };
    localStorage.setItem('smart_goal_exercise', JSON.stringify(data));

    nextStep('view-review');
}
