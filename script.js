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

// --- STATE VARIABLES ---
let realityIncome = 0;
let mentalBankGoal = 0;
let hourlyRate = 0;

// --- INITIALIZATION ---
// Check if user has already done setup
if (localStorage.getItem('mb_setup_complete')) {
    showLedger();
}

// --- EVENT LISTENERS ---

// 1. Calculate Rates based on Reality Income
calculateBtn.addEventListener('click', () => {
    const income = parseFloat(realityInput.value);
    
    if (!income || income <= 0) {
        alert("Please enter a valid income.");
        return;
    }

    realityIncome = income;
    
    // Rule 2: MB Goal is 2x Reality Income
    mentalBankGoal = realityIncome * 2;

    // Rule 3: Hourly Rate is decimal moved 3 places left (divide by 1000)
    hourlyRate = mentalBankGoal / 1000;

    // Update UI
    mbGoalDisplay.textContent = formatCurrency(mentalBankGoal);
    hourlyRateDisplay.textContent = formatCurrency(hourlyRate);
    contractGoal.textContent = formatCurrency(mentalBankGoal);
    contractRate.textContent = formatCurrency(hourlyRate);

    // Show the contract section
    setupResults.classList.remove('hidden');
});

// 2. Enable "Save" button only when contract is checked
contractSigned.addEventListener('change', (e) => {
    saveSetupBtn.disabled = !e.target.checked;
});

// 3. Save Setup and Move to Ledger
saveSetupBtn.addEventListener('click', () => {
    const userName = document.getElementById('user-name').value;
    if (!userName) {
        alert("Please sign the contract with your name.");
        return;
    }

    // Save everything to browser memory
    const userData = {
        userName: userName,
        realityIncome: realityIncome,
        mentalBankGoal: mentalBankGoal,
        hourlyRate: hourlyRate,
        setupDate: new Date().toISOString()
    };

    localStorage.setItem('mb_user_data', JSON.stringify(userData));
    localStorage.setItem('mb_setup_complete', 'true');

    showLedger();
});

// 4. Reset Data (for testing)
resetBtn.addEventListener('click', () => {
    if(confirm("Are you sure? This will erase your contract and rates.")) {
        localStorage.clear();
        location.reload();
    }
});

// --- HELPER FUNCTIONS ---

function showLedger() {
    setupSection.classList.add('hidden');
    ledgerSection.classList.remove('hidden');
    
    // Load data if needed (we will use this in the next step)
    const data = JSON.parse(localStorage.getItem('mb_user_data'));
    console.log("Loaded User:", data);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(num);
}
