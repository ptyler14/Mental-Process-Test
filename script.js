// --- SUPABASE CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL VALUES FROM THE SUPABASE DASHBOARD
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
    } else {
        console.error("Supabase library not found.");
    }

    // Attach Global Event Listeners Here (Safest Place)
    attachEventListeners();
});

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

// --- EVENT LISTENERS SETUP ---
function attachEventListeners() {
    const get = (id) => document.getElementById(id);

    // Setup Goals Button
    const addGoalBtn = get('add-goal-input-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission issues
            addGoalInputRow();
        });
    }

    // Calculate Button
    const calcBtn = get('calculate-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
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

    // Save Setup Button
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

    // Contract Checkbox
    const contractSigned = get('contract-signed');
    if (contractSigned) {
        contractSigned.addEventListener('change', (e) => {
            const btn = get('save-setup-btn');
            if (btn) btn.disabled = !e.target.checked;
        });
    }

    // Add Event Button (Ledger)
    const addEventBtn = get('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', addEventRow);
    }

    // Submit Ledger Button
    const submitBtn = get('submit-ledger-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const sig = get('daily-signature');
            if (sig && !sig.value) return alert("Please sign.");
            if (!currentUser) return alert("Login required.");

            let totalHours = 0;
            document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
            const deduction = get('daily-reality-income') ? (parseFloat(get('daily-reality-income').value) || 0) : 0;
            const net = (totalHours * user.hourlyRate) - deduction;
            const newBalance = user.currentBalance + net;

            const { error } = await supabase
                .from('entries')
                .insert({
                    user_id: currentUser.id,
                    balance: newBalance,
                    happenings: get('daily-happenings') ? get('daily-happenings').value : '',
                    affirmations: get('daily-affirmations') ? get('daily-affirmations').value : ''
                });

            if (error) {
                alert("Error saving: " + error.message);
            } else {
                alert(`Saved! New Balance: ${formatCurrency(newBalance)}`);
                location.reload();
            }
        });
    }

    // Edit Setup Button
    const editBtn = get('edit-setup-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            get('ledger-section').classList.add('hidden');
            get('setup-section').classList.remove('hidden');
            
            if (get('reality-income')) get('reality-income').value = user.realityIncome;
            if (get('user-name')) get('user-name').value = user.userName;
            
            // Load existing goals into inputs
            const list = get('setup-goals-list');
            list.innerHTML = '';
            if (user.goals.length > 0) {
                user.goals.forEach(g => addGoalInputRow(g.title));
            } else {
                addGoalInputRow();
            }
            
            if (get('cancel-setup-btn')) get('cancel-setup-btn').classList.remove('hidden');
        });
    }

    // Cancel Setup Button
    const cancelBtn = get('cancel-setup-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => showLedger());
    }
    
    // Toggle Chart Button
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

    // Login Button
    const loginBtn = get('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
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
        });
    }

    // Logout Button
    const logoutBtn = get('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            location.reload();
        });
    }
    
    // Daily Reality Input Logic
    const dailyInput = get('daily-reality-income');
    if (dailyInput) dailyInput.addEventListener('input', calculateTotals);
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
    
    // Attach remove listener immediately
    row.querySelector('.remove-event').addEventListener('click', function() {
        this.parentElement.remove();
    });

    list.appendChild(row);
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
        document.getElementById('setup-section').classList.remove('hidden');
        if(document.getElementById('cancel-setup-btn')) 
            document.getElementById('cancel-setup-btn').classList.add('hidden');
        addGoalInputRow(); 
    }
}

function showLedger() {
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('ledger-section').classList.remove('hidden');
    
    safeSetText('balance-forward', formatCurrency(user.currentBalance));
    safeSetText('current-hourly-rate', formatCurrency(user.hourlyRate)); 
    safeSetText('today-date', new Date().toLocaleDateString());
    
    const container = document.getElementById('events-container');
    if (container) {
        container.innerHTML = '';
        addEventRow();
    }
    renderHistory();
}

function addEventRow() {
    const container = document.getElementById('events-container');
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

function calculateTotals() {
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    const gross = totalHours * user.hourlyRate;
    const dailyInput = document.getElementById('daily-reality-income');
    const deduction = dailyInput ? (parseFloat(dailyInput.value) || 0) : 0;
    const net = gross - deduction;
    const newBalance = user.currentBalance + net;
    
    safeSetText('todays-deposit', formatCurrency(net));
    safeSetText('new-mb-balance', formatCurrency(newBalance));
}

function renderHistory() {
    const list = document.getElementById('history-list');
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
