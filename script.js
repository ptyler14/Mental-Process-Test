// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 

// --- STATE ---
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: "",
    history: [],
    goals: [] 
};
let chartInstance = null;
let currentUser = null;
let settingsId = null;
let todaysEntryId = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }
});

// --- GLOBAL CLICK HANDLER (Event Delegation) ---
document.addEventListener('click', (e) => {
    const target = e.target;

    // Add Goal Button
    if (target && target.id === 'add-goal-input-btn') {
        e.preventDefault();
        addGoalInputRow();
    }

    // Remove Goal Button (X)
    if (target && target.classList.contains('remove-event') && target.closest('#setup-goals-list')) {
        e.preventDefault();
        target.parentElement.remove();
    }

    // Calculate Button
    if (target && target.id === 'calculate-btn') {
        handleCalculate();
    }

    // Save Setup Button
    if (target && target.id === 'save-setup-btn') {
        handleSaveSetup();
    }

    // Login Button
    if (target && target.id === 'login-btn') {
        handleLogin();
    }

    // Logout Button
    if (target && target.id === 'logout-btn') {
        handleLogout();
    }

    // Edit Setup Button
    if (target && target.id === 'edit-setup-btn') {
        handleEditSetup();
    }

    // Cancel Setup Button
    if (target && target.id === 'cancel-setup-btn') {
        showLedger();
    }

    // Toggle Chart Button
    if (target && target.id === 'toggle-chart-btn') {
        handleToggleChart();
    }

    // Add Event Button (Ledger)
    if (target && target.id === 'add-event-btn') {
        addEventRow();
    }

    // Submit Ledger Button
    if (target && target.id === 'submit-ledger-btn') {
        handleSubmitLedger();
    }

    // Reset Button
    if (target && target.id === 'reset-btn') {
        handleReset();
    }

    // Remove Activity Button (X) inside Ledger
    if (target && target.classList.contains('delete-activity-btn')) {
        // Handled by inline onclick in HTML generation, but good to have backup logic here if needed
    }
});

// --- HANDLERS ---

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-app-container').style.display = 'block';
        loadUserData();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('main-app-container').style.display = 'none';
    }
}

async function handleLogin() {
    const emailVal = document.getElementById('email-input').value;
    const passVal = document.getElementById('password-input').value;
    const msgEl = document.getElementById('auth-message');
    
    if(!emailVal || !passVal) return alert("Enter email and password");
    if(msgEl) msgEl.textContent = "Signing in...";

    let { data, error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });

    if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: emailVal, password: passVal });
        if (signUpError && msgEl) msgEl.textContent = signUpError.message;
        else { alert("Account created! Login to continue."); location.reload(); }
    } else {
        location.reload();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
}

function handleCalculate() {
    const realityInput = document.getElementById('reality-income');
    const income = parseFloat(realityInput.value);
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;

    safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
    safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
    safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
    safeSetText('contract-rate', formatCurrency(user.hourlyRate));
    
    document.getElementById('setup-results').classList.remove('hidden');
}

async function handleSaveSetup() {
    const name = document.getElementById('user-name').value;
    if (!name) return alert("Please sign.");
    user.userName = name;

    // 1. Save Settings
    const settingsData = {
        user_id: currentUser.id,
        reality_income: user.realityIncome,
        mental_bank_goal: user.mentalBankGoal,
        hourly_rate: user.hourlyRate,
        user_name: user.userName
    };

    if (settingsId) {
        await supabase.from('user_settings').update(settingsData).eq('id', settingsId);
    } else {
        await supabase.from('user_settings').insert(settingsData);
    }

    // 2. Save Goals
    await supabase.from('goals').delete().eq('user_id', currentUser.id);
    
    const goalInputs = document.querySelectorAll('.goal-name-input');
    const newGoals = [];
    goalInputs.forEach(input => {
        if(input.value.trim()) {
            newGoals.push({ user_id: currentUser.id, title: input.value.trim() });
        }
    });
    
    if (newGoals.length > 0) {
        const { data: savedGoals } = await supabase.from('goals').insert(newGoals).select();
        if(savedGoals) user.goals = savedGoals;
    }

    showLedger();
}

function handleEditSetup() {
    document.getElementById('ledger-section').classList.add('hidden');
    document.getElementById('setup-section').classList.remove('hidden');
    
    if (document.getElementById('reality-income')) document.getElementById('reality-income').value = user.realityIncome;
    if (document.getElementById('user-name')) document.getElementById('user-name').value = user.userName;
    
    // Load existing goals into inputs
    const list = document.getElementById('setup-goals-list');
    list.innerHTML = '';
    if (user.goals.length > 0) {
        user.goals.forEach(g => addGoalInputRow(g.title));
    } else {
        addGoalInputRow();
    }
    
    document.getElementById('cancel-setup-btn').classList.remove('hidden');
}

function handleToggleChart() {
    const container = document.getElementById('chart-container');
    const btn = document.getElementById('toggle-chart-btn');
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        btn.textContent = "Hide Balance Chart";
        renderChart();
    } else {
        container.classList.add('hidden');
        btn.textContent = "Show Balance Chart";
    }
}

async function handleReset() {
    if(confirm("Delete ALL data?")) {
        await supabase.from('entries').delete().eq('user_id', currentUser.id);
        await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
        await supabase.from('goals').delete().eq('user_id', currentUser.id);
        location.reload();
    }
}

// --- OTHER LISTENERS ---

// Contract Checkbox
const contractSigned = document.getElementById('contract-signed');
if (contractSigned) {
    contractSigned.addEventListener('change', (e) => {
        const btn = document.getElementById('save-setup-btn');
        if (btn) btn.disabled = !e.target.checked;
    });
}

// Daily Reality Input Logic
const dailyInput = document.getElementById('daily-reality-income');
if (dailyInput) dailyInput.addEventListener('input', calculateTotals);

// --- DATA LOADING ---

async function loadUserData() {
    // 1. Load Settings
    const { data: settings } = await supabase.from('user_settings').select('*').limit(1);
    // 2. Load Goals
    const { data: goals } = await supabase.from('goals').select('*');
    if (goals) user.goals = goals;
    // 3. Load Entries
    const { data: entries } = await supabase.from('entries').select('*').order('created_at', { ascending: false });

    if (settings && settings.length > 0) {
        const set = settings[0];
        settingsId = set.id;
        user.realityIncome = set.reality_income;
        user.mentalBankGoal = set.mental_bank_goal;
        user.hourlyRate = set.hourly_rate;
        user.userName = set.user_name;

        if (entries && entries.length > 0) {
            user.history = entries.map(e => ({
                id: e.id,
                dateRaw: new Date(e.created_at),
                date: new Date(e.created_at).toLocaleDateString(),
                balance: Number(e.balance),
                happenings: e.happenings,
                affirmations: e.affirmations,
                activities: e.activities || []
            }));
            
            const lastEntry = user.history[0];
            const todayStr = new Date().toLocaleDateString();
            
            if (lastEntry && lastEntry.date === todayStr) {
                // EDIT MODE
                todaysEntryId = lastEntry.id;
                // Current balance is YESTERDAY'S balance (entry #2)
                user.currentBalance = (user.history[1] ? user.history[1].balance : 0); 
                
                // Load Today's Data into State
                todayEntry.id = lastEntry.id;
                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;

                // Update UI Text
                const subBtn = document.getElementById('submit-ledger-btn');
                const title = document.getElementById('entry-status-title');
                if (subBtn) subBtn.textContent = "Update Today's Entry";
                if (title) title.textContent = "Editing Today's Entry";
                
                // Pre-fill Text Areas
                const haps = document.getElementById('daily-happenings');
                const affs = document.getElementById('daily-affirmations');
                if (haps) haps.value = lastEntry.happenings || '';
                if (affs) affs.value = lastEntry.affirmations || '';

            } else {
                // NEW MODE
                user.currentBalance = lastEntry ? lastEntry.balance : 0;
                todaysEntryId = null;
                todayEntry.id = null;
                todayEntry.activities = [];
                
                const subBtn = document.getElementById('submit-ledger-btn');
                const title = document.getElementById('entry-status-title');
                if (subBtn) subBtn.textContent = "Submit Daily Entry";
                if (title) title.textContent = "Today's Entry";
            }
        } else {
            user.currentBalance = 0;
            user.history = [];
        }
        showLedger();
    } else {
        document.getElementById('setup-section').classList.remove('hidden');
        if(document.getElementById('cancel-setup-btn')) document.getElementById('cancel-setup-btn').classList.add('hidden');
        addGoalInputRow(); 
    }
}

// --- HELPER FUNCTIONS ---

function addGoalInputRow(value = "") {
    const list = document.getElementById('setup-goals-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'goal-input-row';
    row.innerHTML = `
        <input type="text" placeholder="Goal (e.g. Health)" class="goal-name-input" value="${value}">
        <button class="remove-event" type="button">X</button>
    `;
    list.appendChild(row);
}

function showLedger() {
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('ledger-section').classList.remove('hidden');
    
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate)); 
    
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    safeSetText('today-date-display', new Date().toLocaleDateString('en-US', dateOptions));
    
    // Auto-Calculate Daily Reality Income
    todayEntry.dailyRealityDeduction = user.realityIncome / 365;
    const realityDisp = document.getElementById('daily-reality-display');
    if (realityDisp) realityDisp.value = `-${formatCurrency(todayEntry.dailyRealityDeduction)} (Daily Reality Income)`;

    renderActivityList();
    renderGoalsDropdown();
    renderHistory();
}

// Render Goals Dropdown
function renderGoalsDropdown() {
    const select = document.getElementById('new-activity-goal');
    if (!select) return;
    select.innerHTML = '<option value="">General</option>';
    user.goals.forEach(g => {
        select.innerHTML += `<option value="${g.title}">${g.title}</option>`;
    });
}

// Today's Entry State
let todayEntry = {
    id: null, 
    activities: [], 
    happenings: "",
    affirmations: "",
    dailyRealityDeduction: 0
};

function addEventRow() {
    // This function is now handled by the "Add to List" logic below
    // Keeping empty function if referenced elsewhere to prevent crash
}

// Add Activity to List Logic
function addActivityToList() {
    const name = document.getElementById('new-activity-name').value;
    const goal = document.getElementById('new-activity-goal').value;
    const hours = parseFloat(document.getElementById('new-activity-hours').value);

    if (!name || !hours || hours <= 0) return alert("Please enter valid activity and hours.");

    const value = hours * user.hourlyRate;

    // Add to state
    todayEntry.activities.push({ name, goal, hours, value });

    // Clear inputs
    document.getElementById('new-activity-name').value = '';
    document.getElementById('new-activity-hours').value = '';
    
    renderActivityList();
    calculateTotals();
}

// Hook up the add button in the click handler
// (Already done in global click handler above for 'add-activity-btn')
// But we need to link the specific function:
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'add-activity-btn') {
        addActivityToList();
    }
});


function renderActivityList() {
    const container = document.getElementById('todays-activities-list');
    if (!container) return;
    container.innerHTML = '';

    todayEntry.activities.forEach((act, index) => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-details">
                <strong>${act.name}</strong>
                <span class="activity-goal-tag">${act.goal || 'General'}</span>
                <span>${act.hours} hrs @ ${formatCurrency(user.hourlyRate)}/hr</span>
            </div>
            <div class="activity-value">
                <strong>${formatCurrency(act.value)}</strong>
                <button class="delete-activity-btn" onclick="removeActivity(${index})">&times;</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.removeActivity = (index) => {
    todayEntry.activities.splice(index, 1);
    renderActivityList();
    calculateTotals();
};

function calculateTotals() {
    const gross = todayEntry.activities.reduce((sum, act) => sum + act.value, 0);
    const net = gross - todayEntry.dailyRealityDeduction;
    const newBalance = user.currentBalance + net;

    safeSetText('todays-net', formatCurrency(net));
    safeSetText('new-mb-balance', formatCurrency(newBalance));
    
    return { net, newBalance }; 
}

async function handleSubmitLedger() {
    const sig = document.getElementById('daily-signature');
    if (sig && !sig.value) return alert("Please sign.");
    
    const { net, newBalance } = calculateTotals();
    
    const payload = {
        user_id: currentUser.id,
        balance: newBalance,
        happenings: document.getElementById('daily-happenings').value,
        affirmations: document.getElementById('daily-affirmations').value,
        activities: todayEntry.activities 
    };

    let error;
    if (todayEntry.id) {
        const res = await supabase.from('entries').update(payload).eq('id', todayEntry.id);
        error = res.error;
    } else {
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else {
        alert(todayEntry.id ? "Updated!" : "Saved!");
        location.reload();
    }
}


// --- VISUALIZATION ---
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    if (user.history.length === 0) {
        list.innerHTML = '<p class="hint">No entries yet.</p>';
        return;
    }
    list.innerHTML = '';
    
    user.history.forEach(entry => {
        // Parse activities 
        let activityHtml = '';
        if (entry.activities && Array.isArray(entry.activities)) {
            entry.activities.forEach(act => {
                activityHtml += `<span class="history-activity">• ${act.name} (${act.goal || 'Gen'}): ${formatCurrency(act.value)}</span>`;
            });
        }

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-header">
                <span>${new Date(entry.created_at).toLocaleDateString()}</span>
                <span style="color:#27ae60">${formatCurrency(entry.balance)}</span>
            </div>
            ${activityHtml}
            <div class="history-notes">
                Happenings: ${entry.happenings || '-'} <br>
                Affirmations: ${entry.affirmations || '-'}
            </div>
        `;
        list.appendChild(div);
    });
}

function renderChart() {
    const ctxCanvas = document.getElementById('balanceChart');
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext('2d');
    const chronologicalHistory = [...user.history].reverse();
    let labels = chronologicalHistory.map(e => e.date);
    let dataPoints = chronologicalHistory.map(e => e.balance);
    if (labels.length === 0) { labels = ['Start']; dataPoints = [0]; }
    else { if (labels[0] !== 'Start') { labels.unshift('Start'); dataPoints.unshift(0); } }

    if (chartInstance) chartInstance.destroy();
    if (typeof Chart !== 'undefined') {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance',
                    data: dataPoints,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + value; } } } } }
        });
    }
}

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function formatCurrency(num) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num); }
