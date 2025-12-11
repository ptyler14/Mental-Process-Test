// --- STATE ---
// Added 'step-action' to the flow
const steps = [
    'step-intro', 'step-draft', 
    'step-s', 'step-m', 'step-a', 'step-r', 'step-t', 
    'step-obstacles', 'step-action', 'step-summary'
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
    saveCurrentStepData();
    const currentId = steps[currentStepIndex];
    get(currentId).classList.add('hidden');
    currentStepIndex = steps.indexOf(targetId);
    get(targetId).classList.remove('hidden');
    updateProgress();

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
    const draft = get('draft-input').value;
    if (draft) goalData.draft = draft;
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
    
    // Capture Action Data
    goalData.actionName = get('action-name').value || "Work on Goal";
    goalData.actionDate = get('action-date').value;
    goalData.actionTime = get('action-time').value;

    const term = document.querySelector('input[name="term"]:checked').value;
    goalData.term = term;

    buildSummary();
    nextStep('step-summary');
}

function buildSummary() {
    // 1. Text Summary
    get('final-type').textContent = goalData.term === 'long' ? "Long-Term Vision" : "Short-Term Target";
    const statement = `I will ${goalData.s}. I will measure this by ${goalData.m}. This is relevant because ${goalData.r}.`;
    get('final-statement').textContent = statement;
    get('final-deadline').textContent = `${goalData.t_desc} (${goalData.t_date})`;
    get('final-obstacle').textContent = goalData.obstacle;
    get('final-strategy').textContent = goalData.strategy;
    get('final-action-name').textContent = goalData.actionName;

    // 2. Long Term Prompt
    if (goalData.term === 'long') get('long-term-prompt').classList.remove('hidden');
    else get('long-term-prompt').classList.add('hidden');
    
    // 3. Setup Calendar Buttons
    setupCalendarButtons();

    // 4. Save
    localStorage.setItem('last_smart_goal', JSON.stringify(goalData));
}

// --- CALENDAR LOGIC ---

function setupCalendarButtons() {
    if (!goalData.actionDate || !goalData.actionTime) return;

    // Create Start/End Date objects
    const startDateTime = new Date(`${goalData.actionDate}T${goalData.actionTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // Default 1 hour

    // Format for Google (YYYYMMDDTHHMMSSZ) - Convert to UTC or keep local?
    // Google works best with "YYYYMMDDTHHMMSS" format
    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gTitle = encodeURIComponent(`Goal Action: ${goalData.actionName}`);
    const gDetails = encodeURIComponent(`Strategy: ${goalData.strategy}\nGoal: ${goalData.s}`);
    const gDates = `${formatGoogle(startDateTime)}/${formatGoogle(endDateTime)}`;
    
    // Google Link
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}&details=${gDetails}`;
    get('btn-google-cal').onclick = () => window.open(googleUrl, '_blank');

    // Apple/Outlook (.ics file)
    get('btn-apple-cal').onclick = () => downloadICS(startDateTime, endDateTime, goalData.actionName, goalData.strategy);
}

function downloadICS(startDate, endDate, title, description) {
    // Helper to format date for ICS
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Goal Action: ${title}`,
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
