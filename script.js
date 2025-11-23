const button = document.getElementById('entry-btn');
const balanceDisplay = document.getElementById('balance');
let balance = 0;

button.addEventListener('click', () => {
    // Simple test logic: Add $100 every time you click
    balance += 100;
    balanceDisplay.textContent = '$' + balance;
    alert("Great job! You've added an entry.");
});
