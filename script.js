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
    
    attachEventListeners();
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

// --- EVENT LISTENERS ---
function attachEventListeners() {
    
    // --- GOAL SETUP ---
    const addGoalBtn = get('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = get('new-goal-input');
            const value = input.value.trim();
            if (!value) return;
            
            // Add to UI list
            addGoalToListUI(value);
            
            // Add to State (temp until save)
            // We treat the UI list as the source of truth for the "Save" button
            input.value = ''; 
        });
    }

    // ... (Keep all other listeners standard) ...
    
    // Calculate
    const calcBtn = get('calculate-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
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
        });
    }

    // Save Setup
    const saveSetupBtn = get('save-setup-btn');
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
            // We gather them from the UI list
            const goalElements = document.querySelectorAll('.setup-goal-item span');
            const newGoals = [];
            goalElements.forEach(el => {
                newGoals.push({ user_id: currentUser.id, title: el.textContent });
            });

            await supabase.from('goals').delete().eq('user_id', currentUser.id);
            if (newGoals.length > 0) {
                const { data: savedGoals } = await supabase.from('goals').insert(newGoals).select();
                if(savedGoals) user.goals = savedGoals;
            }

            showLedger();
        });
    }

    // Login
    const loginBtn = get('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = get('email-input').value;
            const pass = get('password-input').value;
            if(!email || !pass) return alert("Enter email/password");
            get('auth-message').textContent = "Signing in...";
            
            let { error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) {
                const { error: signUpError } = await supabase.auth.signUp({ email, password: pass });
                if (signUpError) get('auth-message').textContent = signUpError.message;
                else { alert("Account created!"); location.reload(); }
            } else {
                location.reload();
            }
        });
    }

    // Logout
    const logoutBtn = get('logout-btn');
    if(logoutBtn) logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); location.reload(); });

    // Contract Checkbox
    const contractSigned = get('contract-signed');
    if (contractSigned) contractSigned.addEventListener('change', (e) => get('save-setup-btn').disabled = !e.target.checked);

    // Edit Setup
    const editBtn = get('edit-setup-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            get('ledger-section').classList.add('hidden');
            get('setup-section').classList.remove('hidden');
            get('reality-income').value = user.realityIncome;
            get('user-name').value = user.userName;
            
            // Load existing goals
            const list = get('setup-goals-list');
            list.innerHTML = '';
            user.goals.forEach(g => addGoalToListUI(g.title));
            
            get('cancel-setup-btn').classList.remove('hidden');
        });
    }

    // Cancel Setup
    const cancelBtn = get('cancel-setup-btn');
    if(cancelBtn) cancelBtn.addEventListener('click', () => showLedger());

    // Toggle Chart
    const toggleChartBtn = get('toggle-chart-btn');
    if(toggleChartBtn) toggleChartBtn.addEventListener('click', () => {
        const c = get('chart-container');
        c.classList.toggle('hidden');
        toggleChartBtn.textContent = c.classList.contains('hidden') ? "Show Balance Chart" : "Hide Balance Chart";
        if(!c.classList.contains('hidden')) renderChart();
    });

    // Add Activity
    const addActivityBtn = get('add-activity-btn');
    if(addActivityBtn) addActivityBtn.addEventListener('click', addActivityToList);

    // Submit Ledger
    const submitBtn = get('submit-ledger-btn');
    if(submitBtn) submitBtn.addEventListener('click', handleSubmitLedger);

    // Reset
    const resetBtn = get('reset-btn');
    if(resetBtn) resetBtn.addEventListener('click', async () => {
        if(confirm("Delete ALL data?")) {
            await supabase.from('entries').delete().eq('user_id', currentUser.id);
            await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
            await supabase.from('goals').delete().eq('user_id', currentUser.id);
            location.reload();
        }
    });

    // Daily Reality Input
    const dailyInput = get('daily-reality-income');
    if(dailyInput) dailyInput.addEventListener('input', calculateTotals);
}


// --- HELPER FUNCTIONS ---

function addGoalToListUI(title) {
    const list = get('setup-goals-list');
    const div = document.createElement('div');
    div.className = 'setup-goal-item';
    // Use inline styles for simplicity or add to CSS
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px; margin-bottom: 5px; border: 1px solid #eee; border-radius: 4px;';
    div.innerHTML = `
        <span>${title}</span>
        <button class="remove-goal-btn" style="background:none; border:none; color:red; cursor:pointer;">X</button>
    `;
    
    div.querySelector('.remove-goal-btn').addEventListener('click', () => div.remove());
    list.appendChild(div);
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
            
            const lastEntry = user.history[0];
            const todayStr = new Date().toLocaleDateString();
            
            if (lastEntry && lastEntry.date === todayStr) {
                todaysEntryId = lastEntry.id;
                user.currentBalance = (user.history[1] ? user.history[1].balance : 0);
                todayEntry.id = lastEntry.id;
                todayEntry.activities = lastEntry.activities || [];
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;

                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-title').textContent = "Editing Today's Entry";
                if (get('daily-happenings')) get('daily-happenings').value = todayEntry.happenings || '';
                if (get('daily-affirmations')) get('daily-affirmations').value = todayEntry.affirmations || '';
            } else {
                user.currentBalance = lastEntry ? lastEntry.balance : 0;
                todaysEntryId = null;
                todayEntry.id = null;
                todayEntry.activities = [];
                get('submit-ledger-btn').textContent = "Submit Daily Entry";
            }
        }
        showLedger();
    } else {
        get('setup-section').classList.remove('hidden');
        if(get('cancel-setup-btn')) get('cancel-setup-btn').classList.add('hidden');
    }
}

function showLedger() {
    get('setup-section').classList.add('hidden');
    get('ledger-section').classList.remove('hidden');
    
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate));
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    safeSetText('today-date-display', new Date().toLocaleDateString('en-US', dateOptions));
    
    todayEntry.dailyRealityDeduction = user.realityIncome / 365;
    const realityDisp = get('daily-reality-display');
    if(realityDisp) realityDisp.value = `-${formatCurrency(todayEntry.dailyRealityDeduction)}`;

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
    if (!container) return;
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
};

function renderGoalsDropdown() {
    const select = get('new-activity-goal');
    if (!select) return;
    select.innerHTML = '<option value="">General</option>';
    user.goals.forEach(g => { select.innerHTML += `<option value="${g.title}">${g.title}</option>`; });
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
    if (todayEntry.id) {
        const res = await supabase.from('entries').update(payload).eq('id', todayEntry.id);
        error = res.error;
    } else {
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else { alert("Saved!"); location.reload(); }
}

async function handleReset() {
    if(confirm("Delete ALL data?")) {
        await supabase.from('entries').delete().eq('user_id', currentUser.id);
        await supabase.from('user_settings').delete().eq('user_id', currentUser.id);
        await supabase.from('goals').delete().eq('user_id', currentUser.id);
        location.reload();
    }
}

// --- VISUALIZATION ---
function renderHistory() {
    const list = get('history-list');
    if (!list) return;
    if (user.history.length === 0) { list.innerHTML = '<p class="hint">No entries yet.</p>'; return; }
    list.innerHTML = '';
    user.history.forEach(entry => {
        let activityHtml = '';
        if (entry.activities) {
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
                datasets: [{ label: 'Balance', data: dataPoints, borderColor: '#27ae60', backgroundColor: 'rgba(39, 174, 96, 0.2)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + value; } } } } }
        });
    }
}

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function formatCurrency(num) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num); }
