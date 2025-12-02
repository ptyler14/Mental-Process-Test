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
let todaysEntryId = null;

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
        // User is logged in! Load their data.
        loadUserData();
    } else {
        // User is NOT logged in. Redirect them to the Home Page.
        window.location.href = "../index.html";
    }
}

// --- INCOME FORMATTING ---
function setupIncomeFormatting() {
    const input = get('reality-income');
    if (input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            if (!isNaN(value) && value.length > 0) {
                e.target.value = Number(value).toLocaleString('en-US');
            }
        });
    }
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

// --- EVENT LISTENERS ---
function attachEventListeners() {
    
    // Wizard Nav
    if(get('step-1-next-btn')) get('step-1-next-btn').addEventListener('click', handleStep1Next);
    if(get('step-2-back-btn')) get('step-2-back-btn').addEventListener('click', () => showStep('step-1'));
    if(get('step-2-next-btn')) get('step-2-next-btn').addEventListener('click', () => showStep('step-3'));
    if(get('step-3-back-btn')) get('step-3-back-btn').addEventListener('click', () => showStep('step-2'));

    // Goals
    if(get('add-goal-btn')) get('add-goal-btn').addEventListener('click', () => {
        const input = get('new-goal-input');
        addGoalToListUI(input.value.trim());
        input.value = '';
    });

    // Setup Save
    if(get('save-setup-btn')) get('save-setup-btn').addEventListener('click', handleSaveSetup);

    // Logout (Redirects to home after signing out)
    if(get('logout-btn')) get('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = "../index.html";
    });

    // Ledger Actions
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
    const rawIncome = get('reality-income').value.replace(/,/g, '');
    const income = parseFloat(rawIncome);
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;

    safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal) + " /yr");
    safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate) + " /hr");
    safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
    safeSetText('contract-rate', formatCurrency(user.hourlyRate));

    showStep('step-2');
}

function addGoalToListUI(title) {
    if (!title) return;
    const exists = user.goals.some(g => g.title === title);
    if (!exists) user.goals.push({ title: title, isNew: true });
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

window.removeGoal = (index) => { user.goals.splice(index, 1); renderGoalsListUI(); }

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
    const todayStr = new Date().toLocaleDateString('en-US', dateOptions);
    safeSetText('today-date-display', todayStr);
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate) + " /hr");
    
    const entryTitle = get('entry-status-title');
    if (entryTitle) {
        const baseText = todaysEntryId ? "Editing Entry for" : "Entry for";
        entryTitle.textContent = `${baseText} ${todayStr}`;
    }
    
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

    if (!name || !hours || hours <= 0) return alert("Enter valid activity.");

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
            <div class="activity-details"><strong>${act.name}</strong><span class="activity-goal-tag">${act.goal || 'General'}</span><span>${act.hours} hrs @ ${formatCurrency(user.hourlyRate)}/hr</span></div>
            <div class="activity-value"><strong>${formatCurrency(act.value)}</strong><button class="delete-activity-btn" onclick="removeActivity(${index})">&times;</button></div>
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
    return { net, newBalance };
}

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
    if (todaysEntryId) {
        const res = await supabase.from('entries').update(payload).eq('id', todaysEntryId);
        error = res.error;
    } else {
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else {
        get('entry-form-container').classList.add('hidden');
        get('success-message').classList.remove('hidden');
        get('success-message').scrollIntoView({ behavior: 'smooth' });
    }
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
            
            const todayStr = new Date().toLocaleDateString();
            const lastEntry = user.history[0];

            if (lastEntry && lastEntry.date === todayStr) {
                todaysEntryId = lastEntry.id;
                user.currentBalance = (user.history[1] ? Number(user.history[1].balance) : 0);
                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;
                
                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-badge').textContent = "Editing";
                get('daily-happenings').value = todayEntry.happenings || '';
                get('daily-affirmations').value = todayEntry.affirmations || '';
            } else {
                user.currentBalance = lastEntry ? Number(lastEntry.balance) : 0;
                todaysEntryId = null;
            }
        }
        showLedger();
    } else {
        showStep('step-1');
    }
}

// --- VISUALIZATION & UTILS ---
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
        if (entry.activities && Array.isArray(entry.activities)) {
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
    chartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Balance', data: dataPoints, borderColor: '#2980b9', fill: false }] } });
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
