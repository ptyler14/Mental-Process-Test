// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcml3ZG93dXdqeGlmZXlwbGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTczMzIsImV4cCI6MjA3OTQ3MzMzMn0.AZa5GNVDRm1UXU-PiQx7KS0KxQqZ69JbV1Qn2DIlHq0';

let supabase; 
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
// New State for Today's Entry
let todayEntry = {
    id: null, // Null if new, ID if editing
    activities: [], // Array of { name, goal, hours, value }
    happenings: "",
    affirmations: "",
    dailyRealityDeduction: 0
};

let currentUser = null;
let settingsId = null;
let chartInstance = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        init();
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

// --- DATA LOADING ---
async function loadUserData() {
    // 1. Settings
    const { data: settings } = await supabase.from('user_settings').select('*').limit(1);
    // 2. Goals
    const { data: goals } = await supabase.from('goals').select('*');
    if (goals) user.goals = goals;
    // 3. Entries
    const { data: entries } = await supabase.from('entries').select('*').order('created_at', { ascending: false });

    if (settings && settings.length > 0) {
        const set = settings[0];
        settingsId = set.id;
        user.realityIncome = set.reality_income;
        user.mentalBankGoal = set.mental_bank_goal;
        user.hourlyRate = set.hourly_rate;
        user.userName = set.user_name;

        // Process History
        if (entries) {
            user.history = entries;
            user.currentBalance = entries.length > 0 ? Number(entries[0].balance) : 0;
            
            // CHECK FOR TODAY'S ENTRY
            const todayStr = new Date().toLocaleDateString();
            const lastEntry = entries[0];
            
            if (lastEntry && new Date(lastEntry.created_at).toLocaleDateString() === todayStr) {
                // EDIT MODE
                todayEntry.id = lastEntry.id;
                todayEntry.activities = lastEntry.activities || []; // Load saved activities
                todayEntry.happenings = lastEntry.happenings;
                todayEntry.affirmations = lastEntry.affirmations;
                
                // If editing, "Current Balance" should be yesterday's balance (entry #2)
                user.currentBalance = entries.length > 1 ? Number(entries[1].balance) : 0;
                
                get('submit-ledger-btn').textContent = "Update Today's Entry";
                get('entry-status-title').textContent = "Editing Today's Entry";
                
                // Pre-fill UI
                get('daily-happenings').value = todayEntry.happenings || '';
                get('daily-affirmations').value = todayEntry.affirmations || '';
            } else {
                // NEW MODE
                todayEntry.id = null;
                todayEntry.activities = [];
                get('submit-ledger-btn').textContent = "Submit Daily Entry";
                get('entry-status-title').textContent = "Today's Entry";
            }
        }
        
        showLedger();
    } else {
        get('setup-section').classList.remove('hidden');
    }
}

// --- LEDGER LOGIC ---

function showLedger() {
    get('setup-section').classList.add('hidden');
    get('ledger-section').classList.remove('hidden');

    // Header Info
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
    get('today-date-display').textContent = new Date().toLocaleDateString('en-US', dateOptions);
    get('balance-forward').textContent = formatCurrency(user.currentBalance);

    // Auto-Calculate Daily Reality Income (Annual / 365)
    todayEntry.dailyRealityDeduction = user.realityIncome / 365;
    get('daily-reality-display').value = `-${formatCurrency(todayEntry.dailyRealityDeduction)} (Daily Reality Income)`;

    renderActivityList();
    renderGoalsDropdown();
    renderHistory();
    renderChart();
    calculateTotals();
}

// Goals Dropdown for New Activity
function renderGoalsDropdown() {
    const select = get('new-activity-goal');
    select.innerHTML = '<option value="">General</option>';
    user.goals.forEach(g => {
        select.innerHTML += `<option value="${g.title}">${g.title}</option>`;
    });
}

// Add Activity Button Logic
get('add-activity-btn').addEventListener('click', () => {
    const name = get('new-activity-name').value;
    const goal = get('new-activity-goal').value;
    const hours = parseFloat(get('new-activity-hours').value);

    if (!name || !hours || hours <= 0) return alert("Please enter valid activity and hours.");

    const value = hours * user.hourlyRate;

    // Add to state
    todayEntry.activities.push({ name, goal, hours, value });

    // Clear inputs
    get('new-activity-name').value = '';
    get('new-activity-hours').value = '';
    
    renderActivityList();
    calculateTotals();
});

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

// Make removeActivity global so onclick works
window.removeActivity = (index) => {
    todayEntry.activities.splice(index, 1);
    renderActivityList();
    calculateTotals();
};

function calculateTotals() {
    // Sum activity values
    const gross = todayEntry.activities.reduce((sum, act) => sum + act.value, 0);
    const net = gross - todayEntry.dailyRealityDeduction;
    const newBalance = user.currentBalance + net;

    get('todays-net').textContent = formatCurrency(net);
    get('new-mb-balance').textContent = formatCurrency(newBalance);
    
    return { net, newBalance }; // Return for submit
}

get('submit-ledger-btn').addEventListener('click', async () => {
    if (!get('daily-signature').value) return alert("Please sign.");
    
    const { net, newBalance } = calculateTotals();
    
    const payload = {
        user_id: currentUser.id,
        balance: newBalance,
        happenings: get('daily-happenings').value,
        affirmations: get('daily-affirmations').value,
        activities: todayEntry.activities // Save the list!
    };

    let error;
    if (todayEntry.id) {
        // Update existing
        const res = await supabase.from('entries').update(payload).eq('id', todayEntry.id);
        error = res.error;
    } else {
        // Insert new
        const res = await supabase.from('entries').insert(payload);
        error = res.error;
    }

    if (error) alert("Error: " + error.message);
    else {
        alert("Saved!");
        location.reload();
    }
});

// --- HISTORY ---
function renderHistory() {
    const list = get('history-list');
    if (user.history.length === 0) {
        list.innerHTML = '<p class="hint">No entries yet.</p>';
        return;
    }
    list.innerHTML = '';
    
    user.history.forEach(entry => {
        // Parse activities if they exist (handle old entries gracefully)
        let activityHtml = '';
        if (entry.activities && Array.isArray(entry.activities)) {
            entry.activities.forEach(act => {
                activityHtml += `<span class="history-activity">• ${act.name} (${act.goal || 'Gen'}): ${formatCurrency(act.hours * user.hourlyRate)}</span>`;
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

// --- SETUP & AUTH HANDLERS ---
// (Included simplified setup logic for completeness)
get('calculate-btn').addEventListener('click', () => {
    const income = parseFloat(get('reality-income').value);
    if(!income) return;
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;
    get('mb-goal-display').textContent = formatCurrency(user.mentalBankGoal);
    get('hourly-rate-display').textContent = formatCurrency(user.hourlyRate);
    get('setup-results').classList.remove('hidden');
});
get('save-setup-btn').addEventListener('click', async () => {
    user.userName = get('user-name').value;
    const payload = { user_id: currentUser.id, reality_income: user.realityIncome, mental_bank_goal: user.mentalBankGoal, hourly_rate: user.hourlyRate, user_name: user.userName };
    if(settingsId) await supabase.from('user_settings').update(payload).eq('id', settingsId);
    else await supabase.from('user_settings').insert(payload);
    location.reload(); // Reload to refresh state
});
get('login-btn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: get('email-input').value, password: get('password-input').value });
    if(error) alert(error.message); else location.reload();
});
get('contract-signed').addEventListener('change', e => get('save-setup-btn').disabled = !e.target.checked);

// --- HELPERS ---
function formatCurrency(num) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num); }
function renderChart() { /* (Chart code same as before) */ }
