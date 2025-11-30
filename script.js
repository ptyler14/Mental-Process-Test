// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 

// --- HELPER ---
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

// --- AUTH EVENTS (FIXED) ---
const loginBtn = get('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        // Fetch inputs freshly to avoid null errors
        const emailIn = get('email-input');
        const passIn = get('password-input');
        const msgEl = get('auth-message');

        if (!emailIn || !passIn) {
            alert("Error: Login fields not found.");
            return;
        }

        const emailVal = emailIn.value;
        const passVal = passIn.value;
        
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

const logoutBtn = get('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.reload();
    });
}

// --- DATABASE LOADING ---
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
                affirmations: e.affirmations
            }));
            
            const lastEntry = user.history[0];
            const todayStr = new Date().toLocaleDateString();
            
            if (lastEntry && lastEntry.date === todayStr) {
                todaysEntryId = lastEntry.id;
                user.currentBalance = (user.history[1] ? user.history[1].balance : 0); 
                
                const haps = get('daily-happenings');
                const affs = get('daily-affirmations');
                const subBtn = get('submit-ledger-btn');
                
                if (haps) haps.value = lastEntry.happenings || '';
                if (affs) affs.value = lastEntry.affirmations || '';
                if (subBtn) subBtn.textContent = "Update Today's Entry";
            } else {
                user.currentBalance = lastEntry ? lastEntry.balance : 0;
                todaysEntryId = null;
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

// --- SETUP EVENTS ---
const addGoalInputBtn = get('add-goal-input-btn');
if (addGoalInputBtn) addGoalInputBtn.addEventListener('click', () => addGoalInputRow());

function addGoalInputRow(value = "") {
    const list = get('setup-goals-list');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'goal-input-row';
    row.innerHTML = `
        <input type="text" placeholder="Goal (e.g. Health)" class="goal-name-input" value="${value}">
        <button class="remove-event" onclick="this.parentElement.remove()">X</button>
    `;
    list.appendChild(row);
}

const calculateBtn = get('calculate-btn');
if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
        const realityInput = get('reality-income');
        const income = parseFloat(realityInput.value);
        if (!income || income <= 0) return alert("Enter valid income.");
        user.realityIncome = income;
        user.mentalBankGoal = income * 2;
        user.hourlyRate = user.mentalBankGoal / 1000;

        safeSetText('mb-goal-display', formatCurrency(user.mentalBankGoal));
        safeSetText('hourly-rate-display', formatCurrency(user.hourlyRate));
        safeSetText('contract-goal', formatCurrency(user.mentalBankGoal));
        safeSetText('contract-rate', formatCurrency(user.hourlyRate));
        get('setup-results').classList.remove('hidden');
    });
}

const contractSigned = get('contract-signed');
if (contractSigned) {
    contractSigned.addEventListener('change', (e) => {
        const btn = get('save-setup-btn');
        if (btn) btn.disabled = !e.target.checked;
    });
}

const saveSetupBtn = get('save-setup-btn');
if (saveSetupBtn) {
    saveSetupBtn.addEventListener('click', async () => {
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
            if(input.value.trim()) newGoals.push({ user_id: currentUser.id, title: input.value.trim() });
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
    get('setup-section').classList.add('hidden');
    get('ledger-section').classList.remove('hidden');
    
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate)); 
    safeSetText('today-date', new Date().toLocaleDateString());
    
    const container = get('events-container');
    if (container) {
        container.innerHTML = '';
        addEventRow();
    }
    renderHistory();
}

const editSetupBtn = get('edit-setup-btn');
if (editSetupBtn) {
    editSetupBtn.addEventListener('click', () => {
        get('ledger-section').classList.add('hidden');
        get('setup-section').classList.remove('hidden');
        if (get('reality-income')) get('reality-income').value = user.realityIncome;
        if (get('user-name')) get('user-name').value = user.userName;
        
        const list = get('setup-goals-list');
        list.innerHTML = '';
        if (user.goals.length > 0) user.goals.forEach(g => addGoalInputRow(g.title));
        else addGoalInputRow();
        
        if (get('cancel-setup-btn')) get('cancel-setup-btn').classList.remove('hidden');
    });
}

const cancelSetupBtn = get('cancel-setup-btn');
if (cancelSetupBtn) {
    cancelSetupBtn.addEventListener('click', () => showLedger());
}

const toggleChartBtn = get('toggle-chart-btn');
if (toggleChartBtn) {
    toggleChartBtn.addEventListener('click', () => {
        const container = get('chart-container');
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            toggleChartBtn.textContent = "Hide Balance Chart";
            renderChart();
        } else {
            container.classList.add('hidden');
            toggleChartBtn.textContent = "Show Balance Chart";
        }
    });
}

const addEventBtn = get('add-event-btn');
if (addEventBtn) addEventBtn.addEventListener('click', addEventRow);

function addEventRow() {
    const container = get('events-container');
    if (!container) return;
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
    container.appendChild(row);
}

const dailyRealityInput = get('daily-reality-income');
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

const submitLedgerBtn = get('submit-ledger-btn');
if (submitLedgerBtn) {
    submitLedgerBtn.addEventListener('click', async () => {
        const sig = get('daily-signature');
        if (sig && !sig.value) return alert("Please sign.");
        if (!currentUser) return alert("Login required.");

        let totalHours = 0;
        document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
        const deduction = dailyRealityInput ? (parseFloat(dailyRealityInput.value) || 0) : 0;
        const net = (totalHours * user.hourlyRate) - deduction;
        const newBalance = user.currentBalance + net;

        const payload = {
            user_id: currentUser.id,
            balance: newBalance,
            happenings: get('daily-happenings') ? get('daily-happenings').value : '',
            affirmations: get('daily-affirmations') ? get('daily-affirmations').value : ''
        };

        let error;
        if (todaysEntryId) {
            const res = await supabase.from('entries').update(payload).eq('id', todaysEntryId);
            error = res.error;
        } else {
            const res = await supabase.from('entries').insert(payload);
            error = res.error;
        }

        if (error) {
            alert("Error: " + error.message);
        } else {
            alert(todaysEntryId ? "Entry Updated!" : "Entry Saved!");
            location.reload();
        }
    });
}

const resetBtn = get('reset-btn');
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
    const list = get('history-list');
    if (!list) return;
    if (user.history.length === 0) {
        list.innerHTML = '<p class="hint">No entries yet.</p>';
        return;
    }
    list.innerHTML = '';
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
