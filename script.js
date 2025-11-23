// --- SELECT DOM ELEMENTS ---
const realityInput = document.getElementById('reality-income');
const calculateBtn = document.getElementById('calculate-btn');
const setupResults = document.getElementById('setup-results');
const mbGoalDisplay = document.getElementById('mb-goal-display');
const hourlyRateDisplay = document.getElementById('hourly-rate-display');

const contractGoal = document.getElementById('contract-goal');
const contractRate = document.getElementById('contract-rate');
const contractSigned = document.getElementById('contract-signed');
const saveSetupBtn = document.getElementById('save-setup-btn');

const setupSection = document.getElementById('setup-section');
const ledgerSection = document.getElementById('ledger-section');
const resetBtn = document.getElementById('reset-btn');

// Ledger Elements
const balanceForwardDisplay = document.getElementById('balance-forward');
const currentHourlyRateDisplay = document.getElementById('current-hourly-rate');
const todayDateDisplay = document.getElementById('today-date');
const eventsContainer = document.getElementById('events-container');
const addEventBtn = document.getElementById('add-event-btn');
const dailyRealityInput = document.getElementById('daily-reality-income');
const todaysDepositDisplay = document.getElementById('todays-deposit');
const newMbBalanceDisplay = document.getElementById('new-mb-balance');
const dailySignature = document.getElementById('daily-signature');
const submitLedgerBtn = document.getElementById('submit-ledger-btn');
const dailyHappenings = document.getElementById('daily-happenings');
const dailyAffirmations = document.getElementById('daily-affirmations');
const historyList = document.getElementById('history-list');

// --- STATE VARIABLES ---
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: "",
    history: [] 
};
let chartInstance = null;

// --- INITIALIZATION ---
init();

function init() {
    const savedData = localStorage.getItem('mb_user_data');
    if (savedData) {
        user = JSON.parse(savedData);
        if (!user.history) user.history = [];
        
        if (user.userName && user.hourlyRate > 0) {
            showLedger();
        }
    }
}

// --- SETUP EVENTS ---

if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
        const income = parseFloat(realityInput.value);
        
        if (!income || income <= 0) {
            alert("Please enter a valid income.");
            return;
        }

        user.realityIncome = income;
        user.mentalBankGoal = income * 2;
        user.hourlyRate = user.mentalBankGoal / 1000;

        mbGoalDisplay.textContent = formatCurrency(user.mentalBankGoal);
        hourlyRateDisplay.textContent = formatCurrency(user.hourlyRate);
        contractGoal.textContent = formatCurrency(user.mentalBankGoal);
        contractRate.textContent = formatCurrency(user.hourlyRate);

        setupResults.classList.remove('hidden');
    });
}

if (contractSigned) {
    contractSigned.addEventListener('change', (e) => {
        saveSetupBtn.disabled = !e.target.checked;
    });
}

if (saveSetupBtn) {
    saveSetupBtn.addEventListener('click', () => {
        const userName = document.getElementById('user-name').value;
        if (!userName) {
            alert("Please sign the contract with your name.");
            return;
        }

        user.userName = userName;
        user.currentBalance = 0; 
        user.history = [];
        
        saveUser();
        showLedger();
    });
}

// --- LEDGER EVENTS ---

function showLedger() {
    setupSection.classList.add('hidden');
    ledgerSection.classList.remove('hidden');
    
    balanceForwardDisplay.textContent = formatCurrency(user.currentBalance);
    currentHourlyRateDisplay.textContent = formatCurrency(user.hourlyRate) + "/hr";
    if (todayDateDisplay) todayDateDisplay.textContent = new Date().toLocaleDateString();

    eventsContainer.innerHTML = '';
    addEventRow(); 
    renderHistory();
    renderChart(); 
}

if (addEventBtn) {
    addEventBtn.addEventListener('click', addEventRow);
}

function addEventRow() {
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

if (dailyRealityInput) {
    dailyRealityInput.addEventListener('input', calculateTotals);
}

function calculateTotals() {
    let totalHours = 0;
    const hourInputs = document.querySelectorAll('.event-hours');
    
    hourInputs.forEach(input => {
        const val = parseFloat(input.value);
        if (val > 0) totalHours += val;
    });

    const grossDeposit = totalHours * user.hourlyRate;
    const realityDeduction = parseFloat(dailyRealityInput.value) || 0;
    const netDeposit = grossDeposit - realityDeduction;
    const newBalance = user.currentBalance + netDeposit;

    if (todaysDepositDisplay) todaysDepositDisplay.textContent = formatCurrency(netDeposit);
    if (newMbBalanceDisplay) newMbBalanceDisplay.textContent = formatCurrency(newBalance);
}
if (submitLedgerBtn) {
    submitLedgerBtn.addEventListener('click', () => {
        if (!dailySignature.value) return alert("Please sign your entry.");
        
        let totalHours = 0;
        document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
        const gross = totalHours * user.hourlyRate;
        const deduction = parseFloat(dailyRealityInput.value) || 0;
        const net = gross - deduction;

        user.currentBalance += net;

        const newEntry = {
            date: new Date().toLocaleDateString(),
            balance: user.currentBalance,
            happenings: dailyHappenings ? dailyHappenings.value : '',
            affirmations: dailyAffirmations ? dailyAffirmations.value : ''
        };
        user.history.unshift(newEntry);

        saveUser();
        alert(`Entry Saved! New Balance: ${formatCurrency(user.currentBalance)}`);
        location.reload(); 
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if(confirm("Are you sure? This will delete all your data.")) {
            localStorage.clear();
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
                <span class="history-label">Happenings:</span> ${entry.happenings || 'None'} <br>
                <span class="history-label">Affirmations:</span> ${entry.affirmations || 'None'}
            </div>
        `;
        historyList.appendChild(div);
    });
}

function renderChart() {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;

    const chronologicalHistory = [...user.history].reverse();
    let labels = chronologicalHistory.map(e => e.date);
    let dataPoints = chronologicalHistory.map(e => e.balance);

    if (labels.length === 0) {
        labels = ['Start'];
        dataPoints = [0];
    } else {
        labels.unshift('Start');
        dataPoints.unshift(0);
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mental Bank Balance',
                data: dataPoints,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return '$' + value; } }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Balance: ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// --- HELPERS ---

function saveUser() {
    localStorage.setItem('mb_user_data', JSON.stringify(user));
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}
