// --- ELEMENTS ---
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

const balanceForwardDisplay = document.getElementById('balance-forward');
const currentHourlyRateDisplay = document.getElementById('current-hourly-rate');
const eventsContainer = document.getElementById('events-container');
const addEventBtn = document.getElementById('add-event-btn');
const dailyRealityInput = document.getElementById('daily-reality-income');
const newMbBalanceDisplay = document.getElementById('new-mb-balance');
const dailySignature = document.getElementById('daily-signature');
const submitLedgerBtn = document.getElementById('submit-ledger-btn');
const dailyHappenings = document.getElementById('daily-happenings');
const dailyAffirmations = document.getElementById('daily-affirmations');
const historyList = document.getElementById('history-list');

// --- STATE ---
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: "",
    history: [] 
};
let chartInstance = null; // To hold our chart

// --- INIT ---
init();

function init() {
    const savedData = localStorage.getItem('mb_user_data');
    if (savedData) {
        user = JSON.parse(savedData);
        if (!user.history) user.history = [];
        showLedger();
    }
}

// --- SETUP ---
calculateBtn.addEventListener('click', () => {
    const income = parseFloat(realityInput.value);
    if (!income || income <= 0) return alert("Enter valid income.");
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000;

    mbGoalDisplay.textContent = formatCurrency(user.mentalBankGoal);
    hourlyRateDisplay.textContent = formatCurrency(user.hourlyRate);
    contractGoal.textContent = formatCurrency(user.mentalBankGoal);
    contractRate.textContent = formatCurrency(user.hourlyRate);
    setupResults.classList.remove('hidden');
});

contractSigned.addEventListener('change', (e) => saveSetupBtn.disabled = !e.target.checked);

saveSetupBtn.addEventListener('click', () => {
    const name = document.getElementById('user-name').value;
    if (!name) return alert("Please sign.");
    user.userName = name;
    user.currentBalance = 0;
    user.history = [];
    saveUser();
    showLedger();
});

resetBtn.addEventListener('click', () => {
    if(confirm("Reset all data?")) {
        localStorage.clear();
        location.reload();
    }
});

// --- LEDGER ---
function showLedger() {
    setupSection.classList.add('hidden');
    ledgerSection.classList.remove('hidden');
    
    balanceForwardDisplay.textContent = formatCurrency(user.currentBalance);
    currentHourlyRateDisplay.textContent = formatCurrency(user.hourlyRate) + "/hr";
    
    eventsContainer.innerHTML = '';
    addEventRow();
    renderHistory();
    renderChart();
}

addEventBtn.addEventListener('click', addEventRow);

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

dailyRealityInput.addEventListener('input', calculateTotals);

function calculateTotals() {
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    const gross = totalHours * user.hourlyRate;
    const deduction = parseFloat(dailyRealityInput.value) || 0;
    const newBalance = user.currentBalance + (gross - deduction);
    newMbBalanceDisplay.textContent = formatCurrency(newBalance);
}

submitLedgerBtn.addEventListener('click', () => {
    if (!dailySignature.value) return alert("Sign entry.");
    
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    const net = (totalHours * user.hourlyRate) - (parseFloat(dailyRealityInput.value) || 0);

    user.currentBalance += net;
    
    // Add to history
    user.history.unshift({ // Add to TOP of array
        date: new Date().toLocaleDateString(),
        balance: user.currentBalance,
        happenings: dailyHappenings.value,
        affirmations: dailyAffirmations.value
    });

    saveUser();
    alert("Saved!");
    location.reload();
});

// --- VISUALIZATION ---

function renderHistory() {
    if (user.history.length === 0) return;
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
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    // Prepare data (reverse so oldest is first for chart)
    const chartData = [...user.history].reverse();
    const labels = chartData.map(e => e.date);
    const dataPoints = chartData.map(e => e.balance);

    // Add current (start) point if empty
    if(labels.length === 0) {
        labels.push('Start');
        dataPoints.push(0);
    }

    if (chartInstance) chartInstance.destroy(); // Destroy old chart to prevent overlap

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mental Bank Balance',
                data: dataPoints,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function saveUser() { localStorage.setItem('mb_user_data', JSON.stringify(user)); }
function formatCurrency(num) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num); }
