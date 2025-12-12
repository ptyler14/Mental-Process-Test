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
    const percent = (currentStepIndex / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

function updateReferences() {
    const goal = get('inp-initial').value;
    const refs = document.querySelectorAll('.ref-goal');
    refs.forEach(el => el.textContent = goal || "your goal");

    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- REVIEW GENERATION ---
function generateReview() {
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    // Calendar Setup
    const actionName = get('inp-this-week').value || "Work on Goal";
    const actionDate = get('inp-action-date').value;
    const actionTime = get('inp-action-time').value;
    
    if (actionDate && actionTime) {
        setupCalendarButtons(actionName, actionDate, actionTime);
    } else {
        // Disable buttons if no time set, or handle gracefully
        get('btn-google-cal').style.opacity = 0.5;
        get('btn-apple-cal').style.opacity = 0.5;
    }

    const data = {
        initial: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        thisWeek: get('inp-this-week').value,
        date: new Date().toISOString()
    };
    localStorage.setItem('smart_goal_exercise', JSON.stringify(data));

    nextStep('view-review');
}

// --- CALENDAR LOGIC ---
function setupCalendarButtons(title, dateStr, timeStr) {
    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 Hour

    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gTitle = encodeURIComponent(`Goal Action: ${title}`);
    const gDates = `${formatGoogle(startDateTime)}/${formatGoogle(endDateTime)}`;
    
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}`;
    get('btn-google-cal').onclick = () => window.open(googleUrl, '_blank');
    get('btn-google-cal').style.opacity = 1;

    get('btn-apple-cal').onclick = () => downloadICS(startDateTime, endDateTime, title);
    get('btn-apple-cal').style.opacity = 1;
}

function downloadICS(startDate, endDate, title) {
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`,
        `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Goal Action: ${title}`,
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
