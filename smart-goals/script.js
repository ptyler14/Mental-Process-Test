// --- STATE MANAGEMENT ---
const steps = [
    'view-education', 'view-initial', 'view-smart-breakdown', 
    'view-rewrite', 'view-breakdown', 'view-obstacles', 
    'view-resources', 'view-review'
];
let currentStepIndex = 0;
let dateTimePicker = null;

// We need to know which goal we are currently editing
let currentGoalId = null; 
let currentCategory = "Personal Growth"; // Default
let goalPendingCheckIn = null; // Store the goal being checked

// --- DOM HELPER ---
const get = (id) => document.getElementById(id);

// --- DASHBOARD LOGIC (Runs on dashboard.html) ---
function loadDashboard() {
    const grid = get('goals-grid');
    if (!grid) return; // Safety check: stops this running on the wizard page

    grid.innerHTML = ''; // Clear current grid

    // 1. Get Categories (Defaults + User Added)
    const defaults = ['Health', 'Wealth', 'Relationships', 'Personal Growth'];
    let userCats = JSON.parse(localStorage.getItem('user_categories')) || defaults;

    // 2. Get Goals
    const goals = JSON.parse(localStorage.getItem('user_goals_db')) || [];

    // 3. Build the Cards dynamically
    userCats.forEach(catName => {
        // Create the Category Section
        const catCard = document.createElement('div');
        catCard.className = 'category-card';

        // Filter goals for this category
        const catGoals = goals.filter(g => g.category === catName);

        // Determine Color Style
        const styleClass = getCategoryStyle(catName);

        catCard.innerHTML = `
            <div class="cat-header ${styleClass}">
                <h3>${catName}</h3>
                <button class="btn-sm" onclick="startNewGoal('${escapeJS(catName)}')">+ New</button>
            </div>
            <div class="goal-list">
                ${catGoals.length === 0 ? '<div class="empty-state">No active goals.</div>' : ''}
                ${catGoals.map(goal => `
                    <div class="mini-goal-card">
                        <span class="mini-goal-title">${goal.title || "Untitled"}</span>
                        <div class="mini-goal-next">Next: ${goal.nextAction || "None"}</div>
                        <div class="mini-goal-date">📅 ${formatDate(goal.actionDate)}</div>
                    </div>
                `).join('')}
            </div>
        `;

        grid.appendChild(catCard);
    });

    // 4. Run the Check-In Scan
    checkForDueGoals(goals);
}

function addNewCategory() {
    const newCat = prompt("Name your new Life Area (e.g., 'Spirituality', 'Hobbies'):");
    if (newCat && newCat.trim() !== "") {
        const defaults = ['Health', 'Wealth', 'Relationships', 'Personal Growth'];
        let userCats = JSON.parse(localStorage.getItem('user_categories')) || defaults;
        
        if (!userCats.includes(newCat)) {
            userCats.push(newCat);
            localStorage.setItem('user_categories', JSON.stringify(userCats));
            loadDashboard(); // Refresh screen
        } else {
            alert("That category already exists!");
        }
    }
}

function startNewGoal(category) {
    window.location.href = `index.html?category=${encodeURIComponent(category)}`;
}

// --- CHECK-IN SYSTEM LOGIC ---
function checkForDueGoals(goals) {
    const now = new Date();
    
    // Find a goal that:
    // 1. Has a date set
    // 2. Is in the past
    // 3. Is NOT marked 'completed' or 'checked'
    const dueGoal = goals.find(g => {
        if (!g.actionDate || g.status === 'completed' || g.status === 'checked_with_obstacle') return false;
        const actionDate = new Date(g.actionDate);
        return actionDate < now;
    });

    if (dueGoal) {
        openCheckInModal(dueGoal);
    }
}

function openCheckInModal(goal) {
    goalPendingCheckIn = goal;
    const modal = document.getElementById('checkin-modal');
    if(!modal) return; // Safety check

    // Reset Modal State
    document.getElementById('checkin-step-1').classList.remove('hidden');
    document.getElementById('checkin-step-no').classList.add('hidden');
    document.getElementById('checkin-step-yes').classList.add('hidden');
    
    // Fill Info
    document.getElementById('checkin-text').innerHTML = `
        You planned to <strong>${goal.nextAction}</strong> <br>
        on ${formatDate(goal.actionDate)}.
    `;
    
    modal.classList.remove('hidden');
}

function handleCheckIn(success) {
    document.getElementById('checkin-step-1').classList.add('hidden');
    
    if (success) {
        document.getElementById('checkin-step-yes').classList.remove('hidden');
        updateGoalStatus(goalPendingCheckIn.id, 'completed');
    } else {
        document.getElementById('checkin-step-no').classList.remove('hidden');
    }
}

function saveObstacle() {
    const obstacle = document.getElementById('obstacle-input').value;
    if (obstacle) {
        // Mark as checked so it doesn't pop up again immediately
        updateGoalStatus(goalPendingCheckIn.id, 'checked_with_obstacle');
    }
    closeCheckIn();
}

function closeCheckIn() {
    document.getElementById('checkin-modal').classList.add('hidden');
    loadDashboard(); // Refresh UI
}

function updateGoalStatus(id, status) {
    let goals = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        goals[index].status = status;
        localStorage.setItem('user_goals_db', JSON.stringify(goals));
    }
}

// --- WIZARD LOGIC (Runs on index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    // If we are on dashboard page, run dashboard logic
    if(get('goals-grid')) {
        loadDashboard();
        return;
    }

    // Otherwise, we are on the Wizard page
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if(catParam) currentCategory = catParam;

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
