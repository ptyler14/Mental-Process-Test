// --- STATE MANAGEMENT ---
// UPDATED: Removed 'view-education' (start) and 'view-breakdown' (the 3 sub-goals)
const steps = [
    'view-initial', 
    'view-smart-breakdown', 
    'view-rewrite', 
    // 'view-breakdown' was here - DELETED
    'view-obstacles', 
    'view-resources', 
    'view-review'
];

let currentStepIndex = 0;
let dateTimePicker = null;
let currentGoalId = null; 
let currentCategory = "Personal Growth"; 
let goalPendingCheckIn = null; 

// --- DOM HELPER ---
const get = (id) => document.getElementById(id);

// ... (Keep your DASHBOARD LOGIC and CHECK-IN LOGIC here) ...
// ... (Do not delete the loadDashboard, addNewCategory, startNewGoal, or CheckIn functions) ...

// --- WIZARD LOGIC (Runs on index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    // If we are on dashboard page, run dashboard logic
    if(get('goals-grid')) {
        loadDashboard();
        return;
    }

    // --- NEW: EDUCATION MODE CHECK ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'education') {
        // Hide Wizard, Show Education Card
        document.querySelectorAll('.step-view').forEach(el => el.classList.add('hidden'));
        get('view-education').classList.remove('hidden');
        get('progress-container').classList.add('hidden'); // Hide progress bar
        
        // Change the "Start" button on the education page to go back to dashboard
        const startBtn = get('view-education').querySelector('.btn-primary');
        if(startBtn) {
            startBtn.textContent = "Back to Dashboard";
            startBtn.onclick = () => window.location.href = 'dashboard.html';
        }
        return; // Stop here, don't load the wizard
    }
    // ----------------------------------

    const catParam = urlParams.get('category');
    if(catParam) currentCategory = catParam;

    // Force Wizard to start at the new Step 0 (view-initial)
    // We unhide the progress container just in case
    get('progress-container').classList.remove('hidden');
    nextStep(steps[0]);

    // Init Flatpickr
    if (get('action-datetime')) {
        dateTimePicker = flatpickr("#action-datetime", {
            enableTime: true,
            dateFormat: "F j, Y at h:i K",
            minDate: "today",
            time_24hr: false
        });
    }

    // Init Sliders
    if(get('inp-conf-1')) get('inp-conf-1').addEventListener('input', (e) => get('val-conf-1').textContent = e.target.value);
    if(get('inp-conf-2')) get('inp-conf-2').addEventListener('input', (e) => get('val-conf-2').textContent = e.target.value);
});
// --- NAVIGATION ---
function startExercise() {
    get('progress-container').classList.remove('hidden');
    nextStep('view-initial');
}

function nextStep(targetId) {
    const currentId = steps[currentStepIndex];
    if (currentId && get(currentId)) get(currentId).classList.add('hidden');
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
    document.querySelectorAll('.ref-goal').forEach(el => el.textContent = goal || "your goal");

    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- SAVE & GENERATE ---
function generateReview() {
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    const actionName = get('inp-this-week').value || "Work on Goal";
    let actionDateIso = null;
    
    if (dateTimePicker && dateTimePicker.selectedDates.length > 0) {
        const dateObj = dateTimePicker.selectedDates[0];
        actionDateIso = dateObj.toISOString();
        setupCalendarButtons(actionName, dateObj);
    }

    // SAVE TO DATABASE
    saveGoalToDatabase({
        id: Date.now(),
        category: currentCategory,
        title: get('inp-smart-final').value || get('inp-initial').value,
        initialGoal: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        nextAction: actionName,
        actionDate: actionDateIso,
        obstacles: get('inp-obstacles').value,
        strategy: get('inp-responses').value,
        status: 'pending', // New status field
        created: new Date().toISOString()
    });

    nextStep('view-review');
}

function saveGoalToDatabase(newGoal) {
    const db = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    db.push(newGoal);
    localStorage.setItem('user_goals_db', JSON.stringify(db));
}

// --- UTILS ---
function formatDate(isoString) {
    if(!isoString) return "No Date";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' });
}

function getCategoryStyle(name) {
    const styles = ['health', 'wealth', 'relations', 'growth'];
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return styles[sum % styles.length];
}

function escapeJS(str) {
    return str.replace(/'/g, "\\'");
}

function setupCalendarButtons(title, startDateObj) {
    const endDateTime = new Date(startDateObj.getTime() + (60 * 60 * 1000));
    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const gTitle = encodeURIComponent(`Goal Action: ${title}`);
    const gDates = `${formatGoogle(startDateObj)}/${formatGoogle(endDateTime)}`;
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}&details=Reminder+set+from+Goal+Architect`;
    
    const btnGoogle = get('btn-google-cal');
    btnGoogle.onclick = () => window.open(googleUrl, '_blank');
    btnGoogle.style.opacity = '1';

    const btnApple = get('btn-apple-cal');
    btnApple.onclick = () => downloadICS(startDateObj, endDateTime, title);
    btnApple.style.opacity = '1';
}

function downloadICS(startDate, endDate, title) {
    const formatICS = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsContent = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
        `DTSTART:${formatICS(startDate)}`, `DTEND:${formatICS(endDate)}`,
        `SUMMARY:Goal Action: ${title}`, "END:VEVENT", "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'goal-action.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
