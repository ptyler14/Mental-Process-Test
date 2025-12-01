// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 
const get = (id) => document.getElementById(id);

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
let todaysEntryId = null; // FIX: Defined globally to prevent ReferenceError

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }
    attachEventListeners();
    setupIncomeFormatting();
});

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        get('auth-container').classList.add('hidden');
        get('main-app-container').classList.remove('hidden');
        loadUserData();
    } else {
        get('auth-container').classList.remove('hidden');
        get('main-app-container').classList.add('hidden');
    }
}

// --- INCOME FORMATTING (Commas) ---
function setupIncomeFormatting() {
    const input = get('reality-income');
    if (input) {
        input.addEventListener('input', (e) => {
            // Remove non-digits
            let value = e.target.value.replace(/,/g, '');
            if (!isNaN(value) && value.length > 0) {
                // Add commas back
                e.target.value = Number(value).toLocaleString('en-US');
            }
        });
    }
    // Also for goal input (Enter key support)
    const goalInput = get('new-goal-input');
    if (goalInput) {
        goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addGoalToListUI(goalInput.value.trim());
                goalInput.value = '';
            }
        });
    }
}

// --- GLOBAL CLICK HANDLER ---
function attachEventListeners() {
    
    // WIZARD NAVIGATION
    if(get('step-1-next-btn')) get('step-1-next-btn').addEventListener('click', handleStep1Next);
    if(get('step-2-back-btn')) get('step-2-back-btn').addEventListener('click', () => showStep('step-1'));
    if(get('step-2-next-btn')) get('step-2-next-btn').addEventListener('click', () => showStep('step-3'));
    if(get('step-3-back-btn')) get('step-3-back-btn').addEventListener('click', () => showStep('step-2'));

    // GOALS
    if(get('add-goal-btn')) get('add-goal-btn').addEventListener('click', () => {
        const input = get('new-goal-input');
        addGoalToListUI(input.value.trim());
        input.value = '';
    });

    // FINAL SAVE
    if(get('save-setup-btn')) get('save-setup-btn').addEventListener('click', handleSaveSetup);

    // LOGIN/OUT
    if(get('login-btn')) get('login-btn').addEventListener('click', handleLogin);
    if(get('logout-btn')) get('logout-btn').addEventListener('click', handleLogout);

    // LEDGER ACTIONS
    if(get('add-activity-btn')) get('add-activity-btn').addEventListener('click', addActivityToList);
    if(get('submit-ledger-btn')) get('submit-ledger-btn').addEventListener('click', handleSubmitLedger);
    
    if(get('edit-setup-btn')) get('edit-setup-btn').addEventListener('click', () => {
        get('reality-income').value = user.realityIncome.toLocaleString('en-US');
        get('user-name').value = user.userName;
        renderGoalsListUI(); 
        showStep('step-1');
    });
    
    if(get('toggle-chart-btn')) get('toggle-chart-btn').addEventListener('click', handleToggleChart);
    if(get('reset-btn')) get('reset-btn').addEventListener('click', handleReset);

    // Contract Checkbox
    const contractSigned = get('contract-signed');
    if (contractSigned) contractSigned.addEventListener('change', (e) => {
        get('save-setup-btn').disabled = !e.target.checked;
    });
}

// --- NAVIGATION ---
function showStep(stepId) {
    get('setup-wizard').classList.add('hidden');
    get('ledger-section').classList.add('hidden');
    ['step-1', 'step-2', 'step-3'].forEach(id => get(id).classList.add('hidden'));

    if (stepId.startsWith('step-')) {
        get('setup-wizard').classList.remove('hidden');
        get(stepId).classList.remove('hidden');
    } else {
        get(stepId).classList.remove('hidden');
    }
}

// --- HANDLERS ---

function handleStep1Next() {
    // Strip commas to get number
    const rawIncome = get('reality-income').value.replace(/,/g, '');
    const income = parseFloat(rawIncome);
    
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    
    // FIX: Rate is Goal / 2000 (approx hourly wage logic)
    user.hourlyRate = user.mentalBankGoal / 2000;

    safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
    safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
    safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
    safeSetText('contract-rate', formatCurrency(user.hourlyRate));

    showStep('step-2');
}

function addGoalToListUI(title) {
    if (!title) return;
    // Check if already exists to prevent dups
    const exists = user.goals.some(g => g.title === title);
    if (!exists) {
        user.goals.push({ title: title, isNew: true });
    }
    renderGoalsListUI();
}

function renderGoalsListUI() {
    const list = get('setup-goals-list');
    list.innerHTML = '';
    user.goals.forEach((g, index) => {
        const div = document.createElement('div');
        div.className = 'setup-goal-item';
        div.innerHTML = `<span>${g.title}</span><button class="text-btn" style="color:var(--danger)" onclick="removeGoal(${index})">Remove</button>`;
        list.appendChild(div);
    });
}

window.removeGoal = (index) => {
    user.goals.splice(index, 1);
    renderGoalsListUI();
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
    const dbGoals = user.goals.map(g => ({ user_id: currentUser.id, title: g.title }));
    if (dbGoals.length > 0) await supabase.from('goals').insert(dbGoals);

    showLedger();
}

function showLedger() {
    showStep('ledger-section');

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    safeSetText('today-date-display', new Date().toLocaleDateString('en-US', dateOptions));
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate));
    
    // FIX: Auto-Calculate Reality Deduction (Rounded)
    todayEntry.dailyRealityDeduction = Math.round(user.realityIncome / 365);
    get('daily-reality-display').value = `-${formatCurrency(todayEntry.dailyRealityDeduction)}`;

    const select = get('new-activity-goal');
    select.innerHTML = '<option value="">General</option>';
    user.goals.forEach(g => {
        select.innerHTML += `<option value="${g.title}">${g.title}</option>`;
    });

    renderActivityList();
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

// FIX: Renamed to match listener
async function handleSubmitLedger() {
    if (!get('daily-signature').value) return alert("Please sign.");
    
    const { net, newBalance } = calculateTotals();
    
    const payload = {
        user_id: currentUser.id,
        balance: newBalance,
        happenings: get('daily-happenings').value,
        affirmations: get('daily-affirmations').value,
        activities: todayEntry.activities 
    };

    let error;
    // Uses the global todaysEntryId we fixed at the top
    if (todaysEntryId) {
        const res = await supabase.from('entries').update(payload).eq('id', todaysEntryId);
        error = res.error;
    } else {
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else {
        alert(todaysEntryId ? "Updated!" : "Saved!");
        location.reload();
    }
}

// --- AUTH & DATA LOADING (Standard) ---

async function handleLogin() {
    const emailVal = get('email-input').value;
    const passVal = get('password-input').value;
    if(!emailVal || !passVal) return alert("Enter email/password");
    get('auth-message').textContent = "Signing in...";
    
    let { error } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });
    if (error) {
        const { error: signUpError } = await supabase.auth.signUp({ email: emailVal, password: passVal });
        if (signUpError) get('auth-message').textContent = signUpError.message;
        else { alert("Account created!"); location.reload(); }
    } else {
        location.reload();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
}

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
                date: new Date(e.created_at).toLocaleDateString(),
                balance: Number(e.balance),
                happenings: e.happenings,
                affirmations: e.affirmations,
                activities: e.activities || []
            }));
            
            const todayStr = new Date().toLocaleDateString();
            const lastEntry = user.history[0];

            if (lastEntry && lastEntry.date === todayStr) {
                // Edit Mode
                todaysEntryId = lastEntry.id; // This was the scope issue!
                user.currentBalance = (user.history[1] ? Number(user.history[1].balance) : 0);

                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;
                
                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-badge').textContent = "Editing";
                get('daily-happenings').value = todayEntry.happenings || '';
                get('daily-affirmations').value = todayEntry.affirmations || '';
            } else {
                // New Mode
                user.currentBalance = lastEntry ? Number(lastEntry.balance) : 0;
                todaysEntryId = null;
            }
        }
        showLedger();
    } else {
        showStep('step-1');
    }
}

// --- VISUALIZATION ---
function handleToggleChart() {
    const c = get('chart-container');
    c.classList.toggle('hidden');
    if (!c.classList.contains('hidden')) renderChart();
}

function renderHistory() {
    const list = get('history-list');
    if (!list) return;
    if (user.history.length === 0) { list.innerHTML = '<p class="hint">No entries yet.</p>'; return; }
    list.innerHTML = '';
    user.history.forEach(entry => {
        let activityHtml = '';
        if (entry.activities) {
            entry.activities.forEach(act => {
                activityHtml += `<span class="history-activity">• ${act.name} <span style="font-size:0.8em;color:#999">(${act.goal})</span>: ${formatCurrency(act.value)}</span>`;
            });
        }
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<div class="history-header"><span>${entry.date}</span><span style="color:var(--success)">${formatCurrency(entry.balance)}</span></div>${activityHtml}<div class="history-notes">Happenings: ${entry.happenings || '-'} <br>Affirmations: ${entry.affirmations || '-'}</div>`;
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
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Balance', data: dataPoints, borderColor: '#2980b9', fill: false }]
        }
    });
}

async function handleReset() {
    if(confirm("Delete ALL data?")) {
        await supabase.from('entries').delete().eq('user_id', currentUser.id);
        await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
        await supabase.from('goals').delete().eq('user_id', currentUser.id);
        location.reload();
    }
}

function safeSetText(id, text) { const el = get(id); if (el) el.textContent = text; }
function formatCurrency(num) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num); }
