// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 

// --- ELEMENTS ---
const get = (id) => document.getElementById(id);

// Setup Elements
const realityInput = get('reality-income');
const calculateBtn = get('calculate-btn');
const setupResults = get('setup-results');
const mbGoalDisplay = get('mb-goal-display');
const hourlyRateDisplay = get('hourly-rate-display');
const contractGoal = get('contract-goal');
const contractRate = get('contract-rate');
const contractSigned = get('contract-signed');
const saveSetupBtn = get('save-setup-btn');
const cancelSetupBtn = get('cancel-setup-btn');
const setupGoalsList = get('setup-goals-list');
const addGoalInputBtn = get('add-goal-input-btn');

// Ledger Elements
const setupSection = get('setup-section');
const ledgerSection = get('ledger-section');
const resetBtn = get('reset-btn');
const balanceForwardDisplay = get('balance-forward');
const currentHourlyRateDisplay = get('current-hourly-rate');
const todayDateDisplay = get('today-date');
const editSetupBtn = get('edit-setup-btn');
const eventsContainer = get('events-container');
const addEventBtn = get('add-event-btn');
const dailyRealityInput = get('daily-reality-income');
const todaysDepositDisplay = get('todays-deposit');
const newMbBalanceDisplay = get('new-mb-balance');
const dailySignature = get('daily-signature');
const submitLedgerBtn = get('submit-ledger-btn');
const dailyHappenings = get('daily-happenings');
const dailyAffirmations = get('daily-affirmations');
const historyList = get('history-list');
const toggleChartBtn = get('toggle-chart-btn');
const chartContainer = get('chart-container');

// Auth Elements
const authContainer = get('auth-container');
const loginBtn = get('login-btn');
const emailInput = get('email-input');
const passwordInput = get('password-input');
const authMessage = get('auth-message');
const mainAppContainer = get('main-app-container');
const logoutBtn = get('logout-btn');

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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }
});

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        if(authContainer) authContainer.classList.add('hidden');
        if(mainAppContainer) mainAppContainer.style.display = 'block';
        loadUserData();
    } else {
        if(authContainer) authContainer.classList.remove('hidden');
        if(mainAppContainer) mainAppContainer.style.display = 'none';
    }
}

// --- AUTH EVENTS ---
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const emailVal = emailInput.value;
        const passVal = passwordInput.value;
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
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });
}

// --- DATABASE LOADING ---

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
            user.currentBalance = Number(entries[0].balance);
            user.history = entries.map(e => ({
                date: new Date(e.created_at).toLocaleDateString(),
                balance: Number(e.balance),
                happenings: e.happenings,
                affirmations: e.affirmations
            }));
        } else {
            user.currentBalance = 0;
            user.history = [];
        }
        showLedger();
    } else {
        if(setupSection) setupSection.classList.remove('hidden');
        if(cancelSetupBtn) cancelSetupBtn.classList.add('hidden');
        addGoalInputRow(); 
    }
}

// --- SETUP EVENTS ---

// Add Goal Input Row
if (addGoalInputBtn) {
    addGoalInputBtn.addEventListener('click', () => addGoalInputRow());
}

function addGoalInputRow(value = "") {
    const row = document.createElement('div');
    row.className = 'goal-input-row';
    row.innerHTML = `
        <input type="text" placeholder="Goal (e.g. Health)" class="goal-name-input" value="${value}">
        <button class="remove-event" onclick="this.parentElement.remove()">X</button>
    `;
    setupGoalsList.appendChild(row);
}

if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
        const income = parseFloat(realityInput.value);
        if (!income || income <= 0) return alert("Enter valid income.");
        user.realityIncome = income;
        user.mentalBankGoal = income * 2;
        user.hourlyRate = user.mentalBankGoal / 1000;

        safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
        safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
        safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
        safeSetText('contract-rate', formatCurrency(user.hourlyRate));
        if (setupResults) setupResults.classList.remove('hidden');
    });
}

if (contractSigned) {
    contractSigned.addEventListener('change', (e) => {
        if (saveSetupBtn) saveSetupBtn.disabled = !e.target.checked;
    });
}

if (saveSetupBtn) {
    saveSetupBtn.addEventListener('click', async () => {
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

        // 2. Save Goals
        // First delete old goals to keep it simple (full sync)
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
    });
}

// --- LEDGER EVENTS ---

function showLedger() {
    if (setupSection) setupSection.classList.add('hidden');
    if (ledgerSection) ledgerSection.classList.remove('hidden');
    
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate)); 
    safeSetText('today-date', new Date().toLocaleDateString());
    
    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        addEventRow();
    }
    renderHistory();
}

if (editSetupBtn) {
    editSetupBtn.addEventListener('click', () => {
        if (ledgerSection) ledgerSection.classList.add('hidden');
        if (setupSection) setupSection.classList.remove('hidden');
        
        if (realityInput) realityInput.value = user.realityIncome;
        if (get('user-name')) get('user-name').value = user.userName;
        
        // Load existing goals into inputs
        setupGoalsList.innerHTML = '';
        if (user.goals.length > 0) {
            user.goals.forEach(g => addGoalInputRow(g.title));
        } else {
            addGoalInputRow();
        }
        
        if (cancelSetupBtn) cancelSetupBtn.classList.remove('hidden');
    });
}

if (cancelSetupBtn) {
    cancelSetupBtn.addEventListener('click', () => showLedger());
}

if (toggleChartBtn) {
    toggleChartBtn.addEventListener('click', () => {
        if (chartContainer.classList.contains('hidden')) {
            chartContainer.classList.remove('hidden');
            toggleChartBtn.textContent = "Hide Balance Chart";
            renderChart();
        } else {
            chartContainer.classList.add('hidden');
            toggleChartBtn.textContent = "Show Balance Chart";
        }
    });
}

if (addEventBtn) addEventBtn.addEventListener('click', addEventRow);

function addEventRow() {
    if (!eventsContainer) return;
    
    // Build Goal Options
    let goalOptions = '<option value="">(General / No Goal)</option>';
    if (user.goals && user.goals.length > 0) {
        user.goals.forEach(g => {
            goalOptions += `<option value="${g.title}">${g.title}</option>`;
        });
    }

    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
        <input type="text" placeholder="Activity" class="event-name">
        <select class="event-goal">${goalOptions}</select>
        <input type="number" placeholder="Hours" class="event-hours" step="0.5">
        <button class="remove-event">X</button>
    `;
    row.querySelector('.event-hours').addEventListener('input', calculateTotals);
    row.querySelector('.remove-event').addEventListener('click', () => {
        row.remove();
        calculateTotals();
    });
    eventsContainer.appendChild(row);
}

if (dailyRealityInput) dailyRealityInput.addEventListener('input', calculateTotals);

function calculateTotals() {
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    const gross = totalHours * user.hourlyRate;
    const deduction = dailyRealityInput ? (parseFloat(dailyRealityInput.value) || 0) : 0;
    const net = gross - deduction;
    const newBalance = user.currentBalance + net;
    
    safeSetText('todays-deposit', formatCurrency(net));
    safeSetText('new-mb-balance', formatCurrency(newBalance));
}

if (submitLedgerBtn) {
    submitLedgerBtn.addEventListener('click', async () => {
        if (dailySignature && !dailySignature.value) return alert("Please sign.");
        if (!currentUser) return alert("Login required.");

        let totalHours = 0;
        document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
        const deduction = dailyRealityInput ? (parseFloat(dailyRealityInput.value) || 0) : 0;
        const net = (totalHours * user.hourlyRate) - deduction;
        const newBalance = user.currentBalance + net;

        // OPTIONAL: You could save the specific events/goals to a separate table here
        // For now, we just save the aggregate balance.

        const { error } = await supabase
            .from('entries')
            .insert({
                user_id: currentUser.id,
                balance: newBalance,
                happenings: dailyHappenings ? dailyHappenings.value : '',
                affirmations: dailyAffirmations ? dailyAffirmations.value : ''
            });

        if (error) {
            alert("Error saving: " + error.message);
        } else {
            alert(`Saved! New Balance: ${formatCurrency(newBalance)}`);
            location.reload();
        }
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
        if(confirm("Delete ALL data?")) {
            await supabase.from('entries').delete().eq('user_id', currentUser.id);
            await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
            await supabase.from('goals').delete().eq('user_id', currentUser.id);
            location.reload();
        }
    });
}

// --- VISUALIZATION ---
function renderHistory() {
    if (!historyList) return;
    if (user.history.length === 0) {
        historyList.innerHTML = '<p class="hint">No entries yet.</p>';
        return;
    }
    historyList.innerHTML = '';
    user.history.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-date">
                <span>${entry.date}</span>
                <span class="history-balance">${formatCurrency(entry.balance)}</span>
            </div>
            <div class="history-notes">
                <span class="history-label">Happenings:</span> ${entry.happenings || ''} <br>
                <span class="history-label">Affirmations:</span> ${entry.affirmations || ''}
            </div>
        `;
        historyList.appendChild(div);
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
