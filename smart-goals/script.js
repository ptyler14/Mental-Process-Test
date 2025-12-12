// --- STATE ---
const steps = [
    'step-intro', 'step-draft', 'step-reality', 'step-breakdown',
    'step-s', 'step-m', 'step-a', 'step-r', 'step-t', 
    'step-obstacles', 'step-action', 'step-summary'
];
let currentStepIndex = 0;
let goalData = {
    draft: "",
    vision: null, // Stores the big goal if we break it down
    confidence: 5
};

// --- DOM ---
const get = (id) => document.getElementById(id);

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    
    // Live update for confidence slider
    const slider = get('confidence-slider');
    const display = get('confidence-display');
    if (slider) {
        slider.addEventListener('input', (e) => {
            goalData.confidence = parseInt(e.target.value);
            display.textContent = goalData.confidence;
            
            // Color change for feedback
            if (goalData.confidence < 5) display.style.color = "#ef4444"; // Red
            else if (goalData.confidence < 8) display.style.color = "#f59e0b"; // Orange
            else display.style.color = "#10b981"; // Green
        });
    }
});

// --- NAVIGATION ---
function nextStep(targetId) {
    saveCurrentStepData();
    const currentId = steps[currentStepIndex];
    if (currentId && get(currentId)) get(currentId).classList.add('hidden');

    const newIndex = steps.indexOf(targetId);
    if (newIndex === -1) { console.error("Step not found:", targetId); return; }
    
    currentStepIndex = newIndex;
    get(targetId).classList.remove('hidden');
    updateProgress();

    // Special: Update references
    if (targetId.startsWith('step-s') || targetId.startsWith('step-m')) {
        updateDraftReference();
    }
}

function prevStep(targetId) {
    const currentId = steps[currentStepIndex];
    if (currentId) get(currentId).classList.add('hidden');
    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    updateProgress();
}

function updateProgress() {
    const percent = ((currentStepIndex) / (steps.length - 1)) * 100;
    const bar = get('progress-bar');
    if(bar) bar.style.width = `${percent}%`;
    window.scrollTo(0,0);
}

// --- LOGIC ---

function saveCurrentStepData() {
    const draft = get('draft-input').value;
    if (draft) goalData.draft = draft;
}

function processRealityCheck() {
    // Decision Logic: Is this a Destination or an Action?
    // Threshold: 8/10 confidence
    if (goalData.confidence < 8) {
        // Too hard -> Breakdown required
        goalData.vision = goalData.draft; // Save original as Vision
        get('vision-display').textContent = goalData.vision;
        
        nextStep('step-breakdown');
    } else {
        // Actionable -> Go straight to SMART
        goalData.vision = null; // No vision needed, this IS the vision
        nextStep('step-s');
    }
}

function confirmBreakdown() {
    const smallStep = get('breakdown-input').value;
    if (!smallStep) return alert("Please enter a small step.");
    
    // Replace the 'draft' with this new small step for the refinement process
    goalData.draft = smallStep;
    nextStep('step-s');
}

function updateDraftReference() {
    const displays = document.querySelectorAll('.draft-display');
    displays.forEach(el => el.textContent = goalData.draft || "Your goal");
}

function generateGoal() {
    // Capture SMART Data
    goalData.s = get('input-s').value;
    goalData.m = get('input-m').value;
    goalData.a = get('input-a').value;
    goalData.r = get('input-r').value;
    goalData.t_date = get('input-t-date').value;
    goalData.t_desc = get('input-t-desc').value;
    
    goalData.obstacle = get('input-obstacle').value;
    goalData.strategy = get('input-strategy').value;
    
    goalData.actionName = get('action-name').value || "Work on Goal";
    goalData.actionDate = get('action-date').value;
    goalData.actionTime = get('action-time').value;

    buildSummary();
    nextStep('step-summary');
}

function buildSummary() {
    // 1. Show Vision if exists
    const visionCard = get('vision-card');
    if (goalData.vision) {
        visionCard.classList.remove('hidden');
        get('final-vision').textContent = goalData.vision;
        get('final-type').textContent = "Stepping Stone Goal";
    } else {
        visionCard.classList.add('hidden');
        get('final-type').textContent = "SMART Goal";
    }

    // 2. Summary Text
    const statement = `I will ${goalData.s}. I will measure this by ${goalData.m}. This is relevant because ${goalData.r}.`;
    get('final-statement').textContent = statement;
    
    get('final-deadline').textContent = `${goalData.t_desc} (${goalData.t_date})`;
    get('final-obstacle').textContent = goalData.obstacle;
    get('final-strategy').textContent = goalData.strategy;
    get('final-action-name').textContent = goalData.actionName;

    // 3. Calendar Buttons
    setupCalendarButtons();

    localStorage.setItem('last_smart_goal', JSON.stringify(goalData));
}

// --- CALENDAR LOGIC ---
function setupCalendarButtons() {
    if (!goalData.actionDate || !goalData.actionTime) return;

    const startDateTime = new Date(`${goalData.actionDate}T${goalData.actionTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); 

    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gTitle = encodeURIComponent(`Action: ${goalData.actionName}`);
    const gDetails = encodeURIComponent(`Goal: ${goalData.s}\nStrategy: ${goalData.strategy}`);
    const gDates = `${formatGoogle(startDateTime)}/${formatGoogle(endDateTime)}`;
    
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}&details=${gDetails}`;
    get('btn-google-cal').onclick = () => window.open(googleUrl, '_blank');

    get('btn-apple-cal').onclick = () => downloadICS(startDateTime, endDateTime, goalData.actionName, goalData.strategy);
}

function downloadICS(startDate, endDate, title, description) {
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Action: ${title}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'goal-action.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
