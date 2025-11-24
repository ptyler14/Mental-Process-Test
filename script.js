// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://jfriwdowuwjxifeyplke.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zne-fHITlqAxNWyy4ndF7Q_8qWFn3LH';

let supabase; 

// --- ELEMENTS ---
const get = (id) => document.getElementById(id);

const realityInput = get('reality-income');
const calculateBtn = get('calculate-btn');
const setupResults = get('setup-results');
const mbGoalDisplay = get('mb-goal-display');
const hourlyRateDisplay = get('hourly-rate-display');
const contractGoal = get('contract-goal');
const contractRate = get('contract-rate');
const contractSigned = get('contract-signed');
const saveSetupBtn = get('save-setup-btn');

const setupSection = get('setup-section');
const ledgerSection = get('ledger-section');
const resetBtn = get('reset-btn');

const balanceForwardDisplay = get('balance-forward');
const currentHourlyRateDisplay = get('current-hourly-rate');
const todayDateDisplay = get('today-date');
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

const authContainer = get('auth-container');
const loginBtn = get('login-btn');

// --- STATE ---
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: "",
    history: []
};
let chartInstance = null;
let currentUser = null;

// --- INITIALIZATION (Now waits for load) ---
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
        loadUserData();
    } else {
        if(authContainer) authContainer.classList.remove('hidden');
    }
}

// --- AUTH EVENTS ---
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
            }
        });
        if (error) alert("Login failed: " + error.message);
    });
}

// --- DATABASE LOADING ---

async function loadUserData() {
    const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) console.error('DB Error:', error);

    const localData = JSON.parse(localStorage.getItem('mb_user_data'));
    
    if (localData) {
        user = localData;
        
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
    }
}

// --- SETUP EVENTS ---

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
    saveSetupBtn.addEventListener('click', () => {
        const name = get('user-name').value;
        if (!name) return alert("Please sign.");
        user.userName = name;
        localStorage.setItem('mb_user_data', JSON.stringify(user));
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
    renderChart();
}

if (addEventBtn) addEventBtn.addEventListener('click', addEventRow);

function addEventRow() {
    if (!eventsContainer) return;
    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
        <input type="text" placeholder="Activity" class="event-name">
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
        if (!currentUser) return alert("You must be logged in to save to the cloud.");

        let totalHours = 0;
        document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
        const deduction = dailyRealityInput ? (parseFloat(dailyRealityInput.value) || 0) : 0;
        const net = (totalHours * user.hourlyRate) - deduction;
        const newBalance = user.currentBalance + net;

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
            console.error(error);
        } else {
            alert(`Saved to Cloud! New Balance: ${formatCurrency(newBalance)}`);
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
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }
}

// --- HELPERS ---
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}
