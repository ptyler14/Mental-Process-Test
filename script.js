// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 

// --- ELEMENTS ---
const get = (id) => document.getElementById(id);

// State
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: "",
    history: [],
    goals: [] 
};
let todayEntry = {
    id: null,
    activities: [],
    happenings: "",
    affirmations: "",
    dailyRealityDeduction: 0
};
let chartInstance = null;
let currentUser = null;
let settingsId = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }
});

// --- GLOBAL CLICK HANDLER ---
document.addEventListener('click', (e) => {
    const target = e.target;

    // Add Goal Button
    if (target && target.id === 'add-goal-input-btn') {
        e.preventDefault();
        addGoalInputRow();
    }

    // Remove Goal/Activity Button (X)
    if (target && target.classList.contains('remove-event')) {
        e.preventDefault();
        // If inside setup list, just remove
        if (target.closest('#setup-goals-list')) {
            target.parentElement.remove();
        }
        // If inside ledger activity list, remove via logic
        if (target.closest('#todays-activities-list')) {
            // The onclick handler in HTML will handle the logic, this is just fallback
        }
    }

    // Calculate
    if (target && target.id === 'calculate-btn') handleCalculate();

    // Save Setup
    if (target && target.id === 'save-setup-btn') handleSaveSetup();

    // Login
    if (target && target.id === 'login-btn') handleLogin();

    // Logout
    if (target && target.id === 'logout-btn') handleLogout();

    // Edit Setup
    if (target && target.id === 'edit-setup-btn') handleEditSetup();

    // Cancel Setup
    if (target && target.id === 'cancel-setup-btn') showLedger();

    // Toggle Chart
    if (target && target.id === 'toggle-chart-btn') handleToggleChart();

    // Add Activity (Ledger)
    if (target && target.id === 'add-activity-btn') addActivityToList();

    // Submit Ledger
    if (target && target.id === 'submit-ledger-btn') handleSubmitLedger();

    // Reset
    if (target && target.id === 'reset-btn') handleReset();
});

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        get('auth-container').classList.add('hidden');
        get('main-app-container').style.display = 'block';
        loadUserData();
    } else {
        get('auth-container').classList.remove('hidden');
        get('main-app-container').style.display = 'none';
    }
}

// --- AUTH HANDLERS ---
async function handleLogin() {
    const emailVal = get('email-input').value;
    const passVal = get('password-input').value;
    const msgEl = get('auth-message');
    
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

// --- SETUP HANDLERS ---
function addGoalInputRow(value = "") {
    const list = get('setup-goals-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'goal-input-row';
    // Added aria-label for accessibility
    row.innerHTML = `
        <input type="text" placeholder="Goal (e.g. Health)" class="goal-name-input" value="${value}" aria-label="Goal Name">
        <button class="remove-event" type="button" aria-label="Remove Goal">X</button>
    `;
    list.appendChild(row);
}

function handleCalculate() {
    const income = parseFloat(get('reality-income').value);
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;

    safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
    safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
    safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
    safeSetText('contract-rate', formatCurrency(user.hourlyRate));
    
    get('setup-results').classList.remove('hidden');
}

async function handleSaveSetup() {
    const name = get('user-name').value;
    if (!name) return alert("Please sign.");
    user.userName = name;

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
    get('ledger-section').classList.add('hidden');
    get('setup-section').classList.remove('hidden');
    
    if (get('reality-income')) get('reality-income').value = user.realityIncome;
    if (get('user-name')) get('user-name').value = user.userName;
    
    const list = get('setup-goals-list');
    list.innerHTML = '';
    if (user.goals.length > 0) {
        user.goals.forEach(g => addGoalInputRow(g.title));
    } else {
        addGoalInputRow();
    }
    
    if(get('cancel-setup-btn')) get('cancel-setup-btn').classList.remove('hidden');
}

// --- LEDGER HANDLERS ---
function showLedger() {
    get('setup-section').classList.add('hidden');
    get('ledger-section').classList.remove('hidden');

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    safeSetText('today-date-display', new Date().toLocaleDateString('en-US', dateOptions));
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    
    todayEntry.dailyRealityDeduction = user.realityIncome / 365;
    const realityDisp = get('daily-reality-display');
    if (realityDisp) realityDisp.value = `-${formatCurrency(todayEntry.dailyRealityDeduction)} (Daily Reality Income)`;

    renderActivityList();
    renderGoalsDropdown();
    renderHistory();
    renderChart();
    calculateTotals();
}

function addActivityToList() {
    const name = get('new-activity-name').value;
    const goal = get('new-activity-goal').value;
    const hours = parseFloat(get('new-activity-hours').value);

    if (!name || !hours || hours <= 0) return alert("Enter activity and hours.");

    const value = hours * user.hourlyRate;
    todayEntry.activities.push({ name, goal, hours, value });

    get('new-activity-name').value = '';
    get('new-activity-hours').value = '';
    
    renderActivityList();
    calculateTotals();
}

function renderActivityList() {
    const container = get('todays-activities-list');
    if (!container) return;
    container.innerHTML = '';

    todayEntry.activities.forEach((act, index) => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        // Added aria-label to delete button
        div.innerHTML = `
            <div class="activity-details">
                <strong>${act.name}</strong>
                <span class="activity-goal-tag">${act.goal || 'General'}</span>
                <span>${act.hours} hrs @ ${formatCurrency(user.hourlyRate)}/hr</span>
            </div>
            <div class="activity-value">
                <strong>${formatCurrency(act.value)}</strong>
                <button class="delete-activity-btn" onclick="removeActivity(${index})" aria-label="Delete Activity">&times;</button>
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

function renderGoalsDropdown() {
    const select = get('new-activity-goal');
    if (!select) return;
    select.innerHTML = '<option value="">General</option>';
    user.goals.forEach(g => {
        select.innerHTML += `<option value="${g.title}">${g.title}</option>`;
    });
}

function calculateTotals() {
    const gross = todayEntry.activities.reduce((sum, act) => sum + act.value, 0);
    const net = gross - todayEntry.dailyRealityDeduction;
    const newBalance = user.currentBalance + net; 

    safeSetText('todays-net', formatCurrency(net));
    safeSetText('new-mb-balance', formatCurrency(newBalance));
    return { net, newBalance };
}

async function handleSubmitLedger() {
    const sig = get('daily-signature');
    if (sig && !sig.value) return alert("Please sign.");
    
    const { net, newBalance } = calculateTotals();
    
    const payload = {
        user_id: currentUser.id,
        balance: newBalance,
        happenings: get('daily-happenings').value,
        affirmations: get('daily-affirmations').value,
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

function handleToggleChart() {
    const container = get('chart-container');
    const btn = get('toggle-chart-btn');
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

// --- LOAD DATA ---
async function loadUserData() {
    const { data: settings } = await supabase.from('user_settings').select('*').limit(1);
    const { data: goals } = await supabase.from('goals').select('*');
    if (goals) user.goals = goals;
    const { data: entries } = await supabase.from('entries').select('*').order('created_at', { ascending: false });

    if (settings && settings.length > 0) {
        const set = settings[0];
        settingsId = set.id;
        user.realityIncome = set.reality_income;
        user.mentalBankGoal = set.mental_bank_goal;
        user.hourlyRate = set.hourly_rate;
        user.userName = set.user_name;

        if (entries) {
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
                todayEntry.id = lastEntry.id;
                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;
                user.currentBalance = (user.history[1] ? user.history[1].balance : 0);
                
                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-title').textContent = "Editing Today's Entry";
                if (get('daily-happenings')) get('daily-happenings').value = todayEntry.happenings || '';
                if (get('daily-affirmations')) get('daily-affirmations').value = todayEntry.affirmations || '';
            } else {
                user.currentBalance = lastEntry ? lastEntry.balance : 0;
                todayEntry.id = null;
                const subBtn = get('submit-ledger-btn');
                if (subBtn) subBtn.textContent = "Submit Daily Entry";
            }
        }
        showLedger();
    } else {
        get('setup-section').classList.remove('hidden');
        if(get('cancel-setup-btn')) get('cancel-setup-btn').classList.add('hidden');
        addGoalInputRow(); 
    }
}

// --- UTILS ---
function renderHistory() {
    const list = get('history-list');
    if (!list) return;
    if (user.history.length === 0) { list.innerHTML = '<p class="hint">No entries yet.</p>'; return; }
    list.innerHTML = '';
    user.history.forEach(entry => {
        let activityHtml = '';
        if (entry.activities && Array.isArray(entry.activities)) {
            entry.activities.forEach(act => {
                activityHtml += `<span class="history-activity">• ${act.name} (${act.goal || 'Gen'}): ${formatCurrency(act.value)}</span>`;
            });
        }
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<div class="history-header"><span>${entry.date}</span><span style="color:#27ae60">${formatCurrency(entry.balance)}</span></div>${activityHtml}<div class="history-notes">Happenings: ${entry.happenings || '-'} <br>Affirmations: ${entry.affirmations || '-'}</div>`;
        list.appendChild(div);
    });
}

function renderChart() {
    const ctxCanvas = get('balanceChart');
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

// Contract Checkbox Logic
const contractSigned = get('contract-signed');
if (contractSigned) {
    contractSigned.addEventListener('change', (e) => {
        const btn = get('save-setup-btn');
        if (btn) btn.disabled = !e.target.checked;
    });
}

// Daily Reality Input Logic
const dailyInput = get('daily-reality-income');
if (dailyInput) dailyInput.addEventListener('input', calculateTotals);
