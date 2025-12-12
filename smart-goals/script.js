// --- STATE ---
const steps = [
    'step-intro', 'step-vision', 'step-milestones', 'step-select',
    'step-s', 'step-m', 'step-a', 'step-r', 'step-t', 
    'step-obstacles', 'step-action', 'step-summary'
];
let currentStepIndex = 0;
let goalData = {
    vision: "",
    milestones: [],
    target: ""
};

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
    if (currentId && get(currentId)) get(currentId).classList.add('hidden');

    const newIndex = steps.indexOf(targetId);
    currentStepIndex = newIndex;
    
    // Prep screen if needed
    if (targetId === 'step-milestones') updateVisionRefs();
    if (targetId === 'step-select') renderMilestoneSelection();
    if (targetId === 'step-s') updateTargetRefs();

    get(targetId).classList.remove('hidden');
    updateProgress();
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
    const bar = get('progress-bar');
    if (bar) bar.style.width = `${percent}%`;
    window.scrollTo(0,0);
}

// --- LOGIC ---

function saveCurrentStepData() {
    // Capture Vision
    const vInput = get('vision-input');
    if (vInput && vInput.value) goalData.vision = vInput.value;
}

// MILESTONES
function updateVisionRefs() {
    const refs = document.querySelectorAll('.vision-ref');
    refs.forEach(el => el.textContent = goalData.vision || "Your Vision");
}

function addMilestoneInput() {
    const container = get('milestone-list');
    const div = document.createElement('div');
    div.className = 'input-group';
    div.innerHTML = `<input type="text" class="milestone-input" placeholder="Next Milestone...">`;
    container.appendChild(div);
}

function processMilestones() {
    // Collect all inputs
    const inputs = document.querySelectorAll('.milestone-input');
    goalData.milestones = [];
    inputs.forEach(input => {
        if (input.value.trim()) goalData.milestones.push(input.value.trim());
    });

    if (goalData.milestones.length === 0) {
        alert("Please add at least one stepping stone.");
        return;
    }
    nextStep('step-select');
}

// SELECTION
function renderMilestoneSelection() {
    const container = get('selection-container');
    container.innerHTML = '';
    
    goalData.milestones.forEach((m, index) => {
        const label = document.createElement('label');
        label.className = 'radio-card';
        label.innerHTML = `
            <input type="radio" name="target_milestone" value="${m}" ${index===0 ? 'checked' : ''}>
            <div class="radio-content"><strong>${m}</strong></div>
        `;
        container.appendChild(label);
    });
}

function confirmSelection() {
    const selected = document.querySelector('input[name="target_milestone"]:checked');
    if (selected) {
        goalData.target = selected.value;
        nextStep('step-s');
    }
}

function updateTargetRefs() {
    const refs = document.querySelectorAll('.target-display');
    refs.forEach(el => el.textContent = goalData.target);
}

// FINAL GENERATION
function generateGoal() {
    // SMART Data
    goalData.s = get('input-s').value;
    goalData.m = get('input-m').value;
    goalData.a = get('input-a').value;
    goalData.r = get('input-r').value;
    goalData.t_date = get('input-t-date').value; // Deadline
    
    goalData.obstacle = get('input-obstacle').value;
    goalData.strategy = get('input-strategy').value;
    
    // Action Data
    goalData.actionName = get('action-name').value || "Kickoff";
    goalData.actionDate = get('action-date').value;
    goalData.actionTime = get('action-time').value;

    buildSummary();
    nextStep('step-summary');
}

function buildSummary() {
    get('final-vision').textContent = goalData.vision;
    get('final-target-name').textContent = goalData.target;
    
    const statement = `I will ${goalData.s}. I will measure this by ${goalData.m}. This is relevant because ${goalData.r}.`;
    get('final-statement').textContent = statement;
    
    get('final-deadline').textContent = goalData.t_date;
    get('final-obstacle').textContent = goalData.obstacle;
    get('final-strategy').textContent = goalData.strategy;
    get('final-action-name').textContent = goalData.actionName;

    setupCalendarButtons();
    localStorage.setItem('last_smart_goal', JSON.stringify(goalData));
}

// CALENDAR
function setupCalendarButtons() {
    if (!goalData.actionDate || !goalData.actionTime) return;

    const startDateTime = new Date(`${goalData.actionDate}T${goalData.actionTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); 

    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gTitle = encodeURIComponent(`Kickoff: ${goalData.actionName}`);
    const gDetails = encodeURIComponent(`Milestone: ${goalData.target}\nStrategy: ${goalData.strategy}`);
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
        `SUMMARY:Kickoff: ${title}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'kickoff.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
