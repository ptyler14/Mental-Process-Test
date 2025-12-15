// --- CONFIG & STATE ---
const steps = [
    'view-initial', 'view-smart-breakdown', 'view-rewrite', 'view-breakdown',
    'view-obstacles', 'view-resources', 'view-review'
];
let currentStepIndex = 0;
let dateTimePicker = null;
let currentGoalId = null; 
let currentCategory = "Personal Growth"; 
let goalPendingCheckIn = null; 

// --- HELPER FUNCTIONS ---
const get = (id) => document.getElementById(id);
function escapeJS(str) { return str.replace(/'/g, "\\'"); }
function formatDate(isoString) {
    if(!isoString) return "No Date";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' });
}

// --- DASHBOARD FUNCTIONS ---
function loadDashboard() {
    const grid = get('goals-grid');
    if (!grid) return; // Stop if not on dashboard

    grid.innerHTML = ''; 

    // 1. Get Categories
    const defaults = ['Health', 'Wealth', 'Relationships', 'Personal Growth'];
    let userCats = JSON.parse(localStorage.getItem('user_categories')) || defaults;

    // 2. Get Goals
    const goals = JSON.parse(localStorage.getItem('user_goals_db')) || [];

    // 3. Build Grid
    userCats.forEach(catName => {
        const catCard = document.createElement('div');
        catCard.className = 'category-card';
        
        const catGoals = goals.filter(g => g.category === catName);
        // Simple color cycle based on name length
        const styles = ['health', 'wealth', 'relations', 'growth'];
        const sum = catName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const styleClass = styles[sum % styles.length];

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

    // 4. Check for Due Goals
    checkForDueGoals(goals);
}

function addNewCategory() {
    const newCat = prompt("Name your new Life Area:");
    if (newCat && newCat.trim() !== "") {
        const defaults = ['Health', 'Wealth', 'Relationships', 'Personal Growth'];
        let userCats = JSON.parse(localStorage.getItem('user_categories')) || defaults;
        if (!userCats.includes(newCat)) {
            userCats.push(newCat);
            localStorage.setItem('user_categories', JSON.stringify(userCats));
            loadDashboard(); 
        } else {
            alert("That category already exists!");
        }
    }
}

function startNewGoal(category) {
    window.location.href = `index.html?category=${encodeURIComponent(category)}`;
}

// --- CHECK-IN LOGIC ---
function checkForDueGoals(goals) {
    const now = new Date();
    const dueGoal = goals.find(g => {
        // Ignore if no date, or if already completed/checked
        if (!g.actionDate || g.status === 'completed' || g.status === 'checked_with_obstacle') return false;
        const actionDate = new Date(g.actionDate);
        return actionDate < now;
    });

    if (dueGoal) openCheckInModal(dueGoal);
}

function openCheckInModal(goal) {
    goalPendingCheckIn = goal;
    const modal = get('checkin-modal');
    if(!modal) return; 

    get('checkin-step-1').classList.remove('hidden');
    get('checkin-step-no').classList.add('hidden');
    get('checkin-step-yes').classList.add('hidden');
    
    get('checkin-text').innerHTML = `
        You planned to <strong>${goal.nextAction}</strong> <br>
        on ${formatDate(goal.actionDate)}.
    `;
    modal.classList.remove('hidden');
}

function handleCheckIn(success) {
    get('checkin-step-1').classList.add('hidden');
    if (success) {
        get('checkin-step-yes').classList.remove('hidden');
        updateGoalStatus(goalPendingCheckIn.id, 'completed');
    } else {
        get('checkin-step-no').classList.remove('hidden');
    }
}

function saveObstacle() {
    const obstacle = get('obstacle-input').value;
    if (obstacle) updateGoalStatus(goalPendingCheckIn.id, 'checked_with_obstacle');
    closeCheckIn();
}

function closeCheckIn() {
    get('checkin-modal').classList.add('hidden');
    loadDashboard(); 
}

function updateGoalStatus(id, status) {
    let goals = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
        goals[index].status = status;
        localStorage.setItem('user_goals_db', JSON.stringify(goals));
    }
}

// --- WIZARD NAVIGATION ---
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
    
    const newIndex = steps.indexOf(targetId);
    if(newIndex !== -1) {
        currentStepIndex = newIndex;
        get(targetId).classList.remove('hidden');
        updateProgress();
    }
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

// --- SAVING & CALENDAR ---
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

    // SAVE
    const newGoal = {
        id: Date.now(),
        category: currentCategory,
        title: get('inp-smart-final').value || get('inp-initial').value,
        initialGoal: get('inp-initial').value,
        smartFinal: get('inp-smart-final').value,
        nextAction: actionName,
        actionDate: actionDateIso,
        obstacles: get('inp-obstacles').value,
        strategy: get('inp-responses').value,
        status: 'pending', 
        created: new Date().toISOString()
    };
    
    const db = JSON.parse(localStorage.getItem('user_goals_db')) || [];
    db.push(newGoal);
    localStorage.setItem('user_goals_db', JSON.stringify(db));

    nextStep('view-review');
}

function setupCalendarButtons(title, startDateObj) {
    const endDateTime = new Date(startDateObj.getTime() + (60 * 60 * 1000));
    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const gTitle = encodeURIComponent(`Goal Action: ${title}`);
    const gDates = `${formatGoogle(startDateObj)}/${formatGoogle(endDateTime)}`;
    
    const btnGoogle = get('btn-google-cal');
    if(btnGoogle) {
        btnGoogle.onclick = () => window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${gTitle}&dates=${gDates}`, '_blank');
        btnGoogle.style.opacity = '1';
    }
    
    const btnApple = get('btn-apple-cal');
    if(btnApple) {
        btnApple.onclick = () => downloadICS(startDateObj, endDateTime, title);
        btnApple.style.opacity = '1';
    }
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Dashboard Check
    if(get('goals-grid')) {
        loadDashboard();
        return;
    }

    // 2. Education Mode Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'education') {
        document.querySelectorAll('.step-view').forEach(el => el.classList.add('hidden'));
        get('view-education').classList.remove('hidden');
        get('progress-container').classList.add('hidden'); 
        
        const startBtn = get('view-education').querySelector('.btn-primary');
        if(startBtn) {
            startBtn.textContent = "Back to Dashboard";
            startBtn.onclick = () => window.location.href = 'dashboard.html';
        }
        return; 
    }

    // 3. Wizard Init
    const catParam = urlParams.get('category');
    if(catParam) currentCategory = catParam;

    get('progress-container').classList.remove('hidden');
    nextStep(steps[0]);

    if (get('action-datetime')) {
        dateTimePicker = flatpickr("#action-datetime", {
            enableTime: true,
            dateFormat: "F j, Y at h:i K",
            minDate: "today",
            time_24hr: false
        });
    }
    
    if(get('inp-conf-1')) get('inp-conf-1').addEventListener('input', (e) => get('val-conf-1').textContent = e.target.value);
    if(get('inp-conf-2')) get('inp-conf-2').addEventListener('input', (e) => get('val-conf-2').textContent = e.target.value);
});
