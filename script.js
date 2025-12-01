// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_PUBLISHABLE_KEY';

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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }
    attachEventListeners();
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

// --- NAVIGATION HELPERS ---
function showStep(stepId) {
    // Hide all sections
    get('setup-wizard').classList.add('hidden');
    get('ledger-section').classList.add('hidden');
    
    // Hide all wizard steps
    ['step-1', 'step-2', 'step-3'].forEach(id => get(id).classList.add('hidden'));

    if (stepId.startsWith('step-')) {
        get('setup-wizard').classList.remove('hidden');
        get(stepId).classList.remove('hidden');
    } else {
        get(stepId).classList.remove('hidden');
    }
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    
    // WIZARD NAVIGATION
    if(get('step-1-next-btn')) get('step-1-next-btn').addEventListener('click', handleStep1Next);
    if(get('step-2-back-btn')) get('step-2-back-btn').addEventListener('click', () => showStep('step-1'));
    if(get('step-2-next-btn')) get('step-2-next-btn').addEventListener('click', () => showStep('step-3'));
    if(get('step-3-back-btn')) get('step-3-back-btn').addEventListener('click', () => showStep('step-2'));

    // GOALS
    if(get('add-goal-btn')) get('add-goal-btn').addEventListener('click', handleAddGoal);

    // FINAL SAVE
    if(get('save-setup-btn')) get('save-setup-btn').addEventListener('click', handleSaveSetup);

    // LOGIN/OUT
    if(get('login-btn')) get('login-btn').addEventListener('click', handleLogin);
    if(get('logout-btn')) get('logout-btn').addEventListener('click', handleLogout);

    // LEDGER ACTIONS
    if(get('add-activity-btn')) get('add-activity-btn').addEventListener('click', addActivityToList);
    if(get('submit-ledger-btn')) get('submit-ledger-btn').addEventListener('click', handleSubmitLedger);
    if(get('edit-setup-btn')) get('edit-setup-btn').addEventListener('click', () => {
        // Pre-fill data for editing
        get('reality-income').value = user.realityIncome;
        get('user-name').value = user.userName;
        renderGoalsListUI(); // Show current goals
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

// --- HANDLERS ---

function handleStep1Next() {
    const income = parseFloat(get('reality-income').value);
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;

    // Update UI for Step 3 preview
    safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
    safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
    safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
    safeSetText('contract-rate', formatCurrency(user.hourlyRate));

    showStep('step-2');
}

function handleAddGoal() {
    const input = get('new-goal-input');
    const value = input.value.trim();
    if (!value) return;
    
    // Add to local state immediately for UI
    user.goals.push({ title: value, isNew: true }); 
    renderGoalsListUI();
    input.value = '';
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

    // 2. Save Goals (Full Sync)
    await supabase.from('goals').delete().eq('user_id', currentUser.id);
    
    // Prepare goals for DB (remove extra props)
    const dbGoals = user.goals.map(g => ({ user_id: currentUser.id, title: g.title }));
    
    if (dbGoals.length > 0) {
        await supabase.from('goals').insert(dbGoals);
    }

    showLedger();
}

function showLedger() {
    showStep('ledger-section');

    // Update Header
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    safeSetText('today-date-display', new Date().toLocaleDateString('en-US', dateOptions));
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate) + "/hr");
    
    // Auto-Calculate Reality Deduction
    todayEntry.dailyRealityDeduction = user.realityIncome / 365;
    get('daily-reality-display').value = `-${formatCurrency(todayEntry.dailyRealityDeduction)}`;

    // Render Dropdown
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

// --- AUTH ---
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

// --- DATA LOADING ---
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

        // Determine Balance & Today's State
        if (entries) {
            user.history = entries.map(e => ({ ...e, date: new Date(e.created_at).toLocaleDateString() }));
            
            const todayStr = new Date().toLocaleDateString();
            const lastEntry = user.history[0]; // Newest entry

            if (lastEntry && lastEntry.date === todayStr) {
                // EDIT MODE: We have an entry for today
                todaysEntryId = lastEntry.id;
                
                // Balance Forward is YESTERDAY'S balance (entry[1])
                user.currentBalance = (user.history[1] ? Number(user.history[1].balance) : 0);

                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;
                
                // Pre-fill UI
                get('daily-happenings').value = todayEntry.happenings || '';
                get('daily-affirmations').value = todayEntry.affirmations || '';
                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-badge').textContent = "Editing";
                get('entry-status-badge').className = "status-editing"; // Add CSS for this if desired
            } else {
                // NEW MODE: No entry for today
                user.currentBalance = lastEntry ? Number(lastEntry.balance) : 0;
                todaysEntryId = null;
                todayEntry.activities = [];
                get('submit-ledger-btn').textContent = "Submit Daily Entry";
            }
        }
        showLedger();
    } else {
        showStep('step-1');
    }
}

// --- ACTIVITY & TOTALS ---
function addActivityToList() {
    const name = get('new-activity-name').value;
    const goal = get('new-activity-goal').value;
    const hours = parseFloat(get('new-activity-hours').value);

    if (!name || !hours || hours <= 0) return alert("Enter activity details.");

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
}

function calculateTotals() {
    const gross = todayEntry.activities.reduce((sum, act) => sum + act.value, 0);
    const net = gross - todayEntry.dailyRealityDeduction;
    const newBalance = user.currentBalance + net;

    safeSetText('todays-net', formatCurrency(net));
    safeSetText('new-mb-balance', formatCurrency(newBalance));
    return newBalance;
}

async function handleSubmitLedger() {
    const sig = get('daily-signature');
    if (!sig.value) return alert("Please sign.");

    const newBalance = calculateTotals();
    
    const payload = {
        user_id: currentUser.id,
        balance: newBalance,
        happenings: get('daily-happenings').value,
        affirmations: get('daily-affirmations').value,
        activities: todayEntry.activities
    };

    let error;
    if (todaysEntryId) {
        const res = await supabase.from('entries').update(payload).eq('id', todaysEntryId);
        error = res.error;
    } else {
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert(error.message);
    else {
        alert("Saved!");
        location.reload();
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
    if (user.history.length === 0) { list.innerHTML = '<p class="helper-text">No entries yet.</p>'; return; }
    list.innerHTML = '';
    user.history.forEach(entry => {
        // Only show history, don't show today's entry if it's being edited
        // (Optional: remove this check if you want to see today in history)
        
        let activityHtml = '';
        if (entry.activities) {
            entry.activities.forEach(act => {
                activityHtml += `<span class="history-activity">• ${act.name} <span style="font-size:0.8em;color:#999">(${act.goal})</span>: ${formatCurrency(act.value)}</span>`;
            });
        }
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-header">
                <span>${new Date(entry.created_at).toLocaleDateString()}</span>
                <span style="color:var(--success)">${formatCurrency(entry.balance)}</span>
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
    const ctxCanvas = get('balanceChart');
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext('2d');
    // ... (Chart logic same as before) ...
    // Simplified for brevity, assumes Chart.js is loaded
    const chronHistory = [...user.history].reverse();
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chronHistory.map(e => new Date(e.created_at).toLocaleDateString()),
            datasets: [{ label: 'Balance', data: chronHistory.map(e => e.balance), borderColor: '#2980b9', fill: false }]
        }
    });
}

// --- UTILS ---
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
