// --- STATE MANAGEMENT ---
const steps = [
    'view-education', 'view-initial', 'view-smart-breakdown', 
    'view-rewrite', 'view-breakdown', 'view-obstacles', 
    'view-resources', 'view-review'
];
let currentStepIndex = 0;
let dateTimePicker = null;

// New: We need to know which goal we are currently editing
let currentGoalId = null; 
let currentCategory = "Personal Growth"; // Default

// --- DOM HELPER ---
const get = (id) => document.getElementById(id);

// --- DASHBOARD LOGIC (Runs on dashboard.html) ---
function loadDashboard() {
    const goals = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    
    // Clear all lists first
    ['health', 'wealth', 'relations', 'growth'].forEach(cat => {
        const list = get(`list-${cat}`);
        if(list) list.innerHTML = '<div class="empty-state">No active goals.</div>';
    });

    // Populate lists
    goals.forEach(goal => {
        const listId = getListIdByCategory(goal.category);
        const list = get(listId);
        
        // Remove empty state if it exists
        if(list.querySelector('.empty-state')) list.innerHTML = '';

        // Create Card
        const card = document.createElement('div');
        card.className = 'mini-goal-card';
        card.onclick = () => editGoal(goal.id); // Future: Edit functionality
        
        card.innerHTML = `
            <span class="mini-goal-title">${goal.title || "Untitled Goal"}</span>
            <div class="mini-goal-next">Next: ${goal.nextAction || "No action set"}</div>
            <div class="mini-goal-date">📅 ${formatDate(goal.actionDate)}</div>
        `;
        list.appendChild(card);
    });
}

function getListIdByCategory(cat) {
    if(cat === 'Health') return 'list-health';
    if(cat === 'Wealth') return 'list-wealth';
    if(cat === 'Relationships') return 'list-relations';
    return 'list-growth';
}

function startNewGoal(category) {
    // Redirect to the wizard with category param
    window.location.href = `index.html?category=${encodeURIComponent(category)}`;
}

// --- WIZARD LOGIC (Runs on index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the Dashboard or the Wizard
    if(get('goals-grid')) return; // We are on dashboard, stop here.

    // 1. Capture Category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if(catParam) currentCategory = catParam;

    // 2. Init Flatpickr
    if (get('action-datetime')) {
        dateTimePicker = flatpickr("#action-datetime", {
            enableTime: true,
            dateFormat: "F j, Y at h:i K",
            minDate: "today",
            time_24hr: false
        });
    }

    // 3. Init Sliders
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

function updateProgress() {
    const percent = (currentStepIndex / (steps.length - 1)) * 100;
    get('progress-bar').style.width = `${percent}%`;
    window.scrollTo(0,0);
}

function updateReferences() {
    // Update simple text refs
    const goal = get('inp-initial').value;
    document.querySelectorAll('.ref-goal').forEach(el => el.textContent = goal || "your goal");

    // Update Step 3 Summary
    if (currentStepIndex === steps.indexOf('view-rewrite')) {
        get('ref-s').textContent = get('inp-s').value;
        get('ref-m').textContent = get('inp-m').value;
        get('ref-t').textContent = get('inp-t').value;
    }
}

// --- SAVE & GENERATE ---
function generateReview() {
    // 1. Populate Review Screen
    get('out-smart-final').textContent = get('inp-smart-final').value;
    get('out-this-week').textContent = get('inp-this-week').value;
    get('out-obstacles').textContent = get('inp-obstacles').value;
    get('out-responses').textContent = get('inp-responses').value;
    
    // 2. Handle Date/Time
    const actionName = get('inp-this-week').value || "Work on Goal";
    let actionDateIso = null;
    
    if (dateTimePicker && dateTimePicker.selectedDates.length > 0) {
        const dateObj = dateTimePicker.selectedDates[0];
        actionDateIso = dateObj.toISOString();
        setupCalendarButtons(actionName, dateObj);
    }

    // 3. SAVE TO DATABASE (Array)
    saveGoalToDatabase({
        id: Date.now(), // Simple unique ID
        category: currentCategory,
        title: get('inp-smart-final').value || get('inp-initial').value,
        initialGoal: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        nextAction: actionName,
        actionDate: actionDateIso,
        obstacles: get('inp-obstacles').value,
        strategy: get('inp-responses').value,
        created: new Date().toISOString()
    });

    nextStep('view-review');
}

function saveGoalToDatabase(newGoal) {
    // Get existing array
    const db = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    // Add new goal
    db.push(newGoal);
    // Save back
    localStorage.setItem('user_goals_db', JSON.stringify(db));
}

// --- UTILS ---
function formatDate(isoString) {
    if(!isoString) return "No Date";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' });
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
