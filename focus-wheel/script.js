const centerInput = document.getElementById('centerInput');
const setCenterBtn = document.getElementById('setCenterBtn');
const statementInput = document.getElementById('statementInput');
const addStatementBtn = document.getElementById('addStatementBtn');
const centerText = document.getElementById('centerText');
const wheel = document.getElementById('wheel');

let currentRotation = 0;
let statementCount = 0;

setCenterBtn.addEventListener('click', () => {
    const centerValue = centerInput.value.trim();
    if (centerValue) {
        centerText.textContent = centerValue;
        centerInput.value = '';
    }
});

addStatementBtn.addEventListener('click', () => {
    const statementValue = statementInput.value.trim();
    if (!statementValue) return;

    // Rotate wheel 30 degrees counterclockwise
    currentRotation -= 30;
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // Create new statement element
    const newStatement = document.createElement('div');
    newStatement.className = 'statement';
    newStatement.textContent = statementValue;

    // Rotate back so text stays horizontal
    newStatement.style.transform = `translate(-50%, 0) rotate(${-currentRotation}deg)`;

    wheel.appendChild(newStatement);

    statementInput.value = '';
    statementCount++;
});
