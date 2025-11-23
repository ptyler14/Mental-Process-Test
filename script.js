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
const todayDateDisplay = document.getElementById('today-date'); // Make sure this ID exists in HTML
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
// This runs when the page loads
init();

function init() {
    const savedData = localStorage.getItem('mb_user_data');
    if (savedData) {
        user = JSON.parse(savedData);
        // Ensure history array exists for old users
        if (!user.history) user.history = [];
        
        // Check if setup is complete
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
        
        // Rule 2: MB Goal is 2x Reality Income
        user.mentalBankGoal = income * 2;

        // Rule 3: Hourly Rate is decimal moved 3 places left (divide by 1000)
        user.hourlyRate = user.mentalBankGoal / 1000;

        // Update UI
        mbGoalDisplay.textContent = formatCurrency(user.mentalBankGoal);
        hourlyRateDisplay.textContent = formatCurrency(user.hourlyRate);
        contractGoal.textContent = formatCurrency(user.mentalBankGoal);
        contractRate.textContent = formatCurrency(user.hourlyRate);

        // Show the contract section
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
        user.currentBalance = 0; // Start at 0
        user.history = []; // Start fresh history
        
        saveUser();
        showLedger();
    });
}

// --- LEDGER EVENTS ---

function showLedger() {
    setupSection.classList.add('hidden');
    ledgerSection.classList.remove('hidden');
    
    // Update Header Info
    balanceForwardDisplay.textContent = formatCurrency(user.currentBalance);
    currentHourlyRateDisplay.textContent = formatCurrency(user.hourlyRate) + "/hr";
    if (todayDateDisplay) todayDateDisplay.textContent = new Date().toLocaleDateString();

    // Initialize Ledger View
    eventsContainer.innerHTML = ''; // Clear old rows
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

    // 1. Calculate Value of Events (Hours * Rate)
    const grossDeposit = totalHours * user.hourlyRate;

    // 2. Subtract Reality Income
    const realityDeduction = parseFloat(dailyRealityInput.value) || 0;
    
    // 3. Net Deposit
    const netDeposit = grossDeposit - realityDeduction;

    // 4. New Balance (Display only, not saved yet)
    const newBalance = user.currentBalance + netDeposit;

    // Update Screen
    if (todaysDepositDisplay) todaysDepositDisplay.textContent = formatCurrency(netDeposit);
    if (newMbBalanceDisplay) newMbBalanceDisplay.textContent = formatCurrency(newBalance);
}

if (submitLedgerBtn) {
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

        // Add History Entry
        const newEntry = {
            date: new Date().toLocaleDateString(),
            balance: user.currentBalance,
            happenings: dailyHappenings ? dailyHappenings.value : '',
            affirmations: dailyAffirmations ? dailyAffirmations.value : ''
        };
        user.history.unshift(newEntry); // Add to top of list

        saveUser();

        alert(`Entry Saved! New Balance: ${formatCurrency(user.currentBalance)}`);
        
        // Refresh page to reset inputs
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
