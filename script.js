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
const todaysDepositDisplay = document.getElementById('todays-deposit'); // Fixed selector if missing
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
let chartInstance = null;

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
    todayDateDisplay.textContent = new Date().toLocaleDateString(); // Ensure date is shown
    
    eventsContainer.innerHTML = '';
    addEventRow();
    renderHistory();
    renderChart(); // Draw the chart immediately
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
    const net = gross - deduction;
    
    // Calculate potential new balance for display only
    const potentialBalance = user.currentBalance + net;
    
    if (todaysDepositDisplay) todaysDepositDisplay.textContent = formatCurrency(net);
    newMbBalanceDisplay.textContent = formatCurrency(potentialBalance);
}

submitLedgerBtn.addEventListener('click', () => {
    if (!dailySignature.value) return alert("Sign entry.");
    
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    
    // Calc Net
    const net = (totalHours * user.hourlyRate) - (parseFloat(dailyRealityInput.value) || 0);

    // Update Balance
    user.currentBalance += net;
    
    // Add to history (Newest first)
    user.history.unshift({
        date: new Date().toLocaleDateString(), // Store simpler date format
        balance: user.currentBalance,
        happenings: dailyHappenings.value,
        affirmations: dailyAffirmations.value
    });

    saveUser();
    alert("Entry Saved!");
    
    // Instead of full reload, just re-render to keep it smooth
    location.reload(); 
});

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
    if(!ctx) return; // Safety check

    // 1. Prepare Data
    // We reverse the history because the array has newest first,
    // but the chart needs oldest first (left to right).
    const chronologicalHistory = [...user.history].reverse();
    
    let labels = chronologicalHistory.map(e => e.date);
    let dataPoints = chronologicalHistory.map(e => e.balance);

    // 2. Add a "Start" point at $0 if the chart is sparse
    // This ensures you see a line going up from 0 even on your first day.
    if (labels.length === 0) {
        labels = ['Start'];
        dataPoints = [0];
    } else {
        // Optional: Always show the "Start" point at the beginning
        labels.unshift('Start');
        dataPoints.unshift(0);
    }

    // 3. Destroy old chart to prevent "glitchy" overlays
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 4. Create New Chart
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mental Bank Balance',
                data: dataPoints,
                borderColor: '#27ae60', // Green line
                backgroundColor: 'rgba(39, 174, 96, 0.2)', // Light green fill
                fill: true,
                tension: 0.3, // Makes the line slightly curvy
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // This puts the '$' sign on the chart axis!
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks
