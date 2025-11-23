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

// --- STATE VARIABLES ---
let user = {
    realityIncome: 0,
    mentalBankGoal: 0,
    hourlyRate: 0,
    currentBalance: 0,
    userName: ""
};

// --- INITIALIZATION ---
init();

function init() {
    const savedData = localStorage.getItem('mb_user_data');
    if (savedData) {
        user = JSON.parse(savedData);
        showLedger();
    }
}

// --- SETUP EVENTS ---

calculateBtn.addEventListener('click', () => {
    const income = parseFloat(realityInput.value);
    if (!income || income <= 0) return alert("Enter valid income.");
    
    user.realityIncome = income;
    user.mentalBankGoal = income * 2;
    user.hourlyRate = user.mentalBankGoal / 1000; // Symbolic rate rule

    mbGoalDisplay.textContent = formatCurrency(user.mentalBankGoal);
    hourlyRateDisplay.textContent = formatCurrency(user.hourlyRate);
    contractGoal.textContent = formatCurrency(user.mentalBankGoal);
    contractRate.textContent = formatCurrency(user.hourlyRate);

    setupResults.classList.remove('hidden');
});

contractSigned.addEventListener('change', (e) => saveSetupBtn.disabled = !e.target.checked);

saveSetupBtn.addEventListener('click', () => {
    const name = document.getElementById('user-name').value;
    if (!name) return alert("Please sign the contract.");
    
    user.userName = name;
    user.currentBalance = 0; // Start at 0
    saveUser();
    showLedger();
});

resetBtn.addEventListener('click', () => {
    if(confirm("Delete all data and start over?")) {
        localStorage.clear();
        location.reload();
    }
});

// --- LEDGER EVENTS ---

function showLedger() {
    setupSection.classList.add('hidden');
    ledgerSection.classList.remove('hidden');
    
    // Update Header Info
    balanceForwardDisplay.textContent = formatCurrency(user.currentBalance);
    currentHourlyRateDisplay.textContent = formatCurrency(user.hourlyRate) + "/hr";
    todayDateDisplay.textContent = new Date().toLocaleDateString();

    // Add first empty row
    addEventRow(); 
}

// Add a new row for an event
addEventBtn.addEventListener('click', addEventRow);

function addEventRow() {
    const row = document.createElement('div');
    row.className = 'event-row';
    row.innerHTML = `
        <input type="text" placeholder="Activity (e.g. Gym)" class="event-name">
        <input type="number" placeholder="Hours" class="event-hours" step="0.5">
        <button class="remove-event">X</button>
    `;
    
    // Add listeners to inputs to update totals immediately
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
    const hourInputs = document.querySelectorAll('.event-hours');
    
    hourInputs.forEach(input => {
        const val = parseFloat(input.value);
        if (val > 0) totalHours += val;
    });

    // 1. Calculate Value of Events (Hours * Rate)
    const grossDeposit = totalHours * user.hourlyRate;

    // 2. Subtract Reality Income
    const realityDeduction = parseFloat(dailyRealityInput.value) || 0;
    
    // 3. Net Deposit
    const netDeposit = grossDeposit - realityDeduction;

    // 4. New Balance
    const newBalance = user.currentBalance + netDeposit;

    // Update Screen
    todaysDepositDisplay.textContent = formatCurrency(netDeposit);
    newMbBalanceDisplay.textContent = formatCurrency(newBalance);
}

submitLedgerBtn.addEventListener('click', () => {
    if (!dailySignature.value) return alert("Please sign your entry.");
    
    // Calculate final numbers one last time
    let totalHours = 0;
    document.querySelectorAll('.event-hours').forEach(i => totalHours += (parseFloat(i.value) || 0));
    const gross = totalHours * user.hourlyRate;
    const deduction = parseFloat(dailyRealityInput.value) || 0;
    const net = gross - deduction;

    // Update User Balance
    user.currentBalance += net;
    saveUser();

    alert(`Entry Saved! New Balance: ${formatCurrency(user.currentBalance)}`);
    
    // Refresh page to reset inputs for next day (or clear inputs manually)
    location.reload(); 
});

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
